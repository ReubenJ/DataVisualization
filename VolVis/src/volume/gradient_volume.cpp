#include "gradient_volume.h"
#include <algorithm>
#include <exception>
#include <glm/geometric.hpp>
#include <glm/vector_relational.hpp>
#include <gsl/span>

namespace volume {

// Compute the maximum magnitude from all gradient voxels
static float computeMaxMagnitude(gsl::span<const GradientVoxel> data)
{
    return std::max_element(
        std::begin(data),
        std::end(data),
        [](const GradientVoxel& lhs, const GradientVoxel& rhs) {
            return lhs.magnitude < rhs.magnitude;
        })
        ->magnitude;
}

// Compute the minimum magnitude from all gradient voxels
static float computeMinMagnitude(gsl::span<const GradientVoxel> data)
{
    return std::min_element(
        std::begin(data),
        std::end(data),
        [](const GradientVoxel& lhs, const GradientVoxel& rhs) {
            return lhs.magnitude < rhs.magnitude;
        })
        ->magnitude;
}

// Compute a gradient volume from a volume
static std::vector<GradientVoxel> computeGradientVolume(const Volume& volume)
{
    const auto dim = volume.dims();

    std::vector<GradientVoxel> out(static_cast<size_t>(dim.x * dim.y * dim.z));
    for (int z = 1; z < dim.z - 1; z++) {
        for (int y = 1; y < dim.y - 1; y++) {
            for (int x = 1; x < dim.x - 1; x++) {
                const float gx = (volume.getVoxel(x + 1, y, z) - volume.getVoxel(x - 1, y, z)) / 2.0f;
                const float gy = (volume.getVoxel(x, y + 1, z) - volume.getVoxel(x, y - 1, z)) / 2.0f;
                const float gz = (volume.getVoxel(x, y, z + 1) - volume.getVoxel(x, y, z - 1)) / 2.0f;

                const glm::vec3 v { gx, gy, gz };
                const size_t index = static_cast<size_t>(x + dim.x * (y + dim.y * z));
                out[index] = GradientVoxel { v, glm::length(v) };
            }
        }
    }
    return out;
}

GradientVolume::GradientVolume(const Volume& volume)
    : m_dim(volume.dims())
    , m_data(computeGradientVolume(volume))
    , m_minMagnitude(computeMinMagnitude(m_data))
    , m_maxMagnitude(computeMaxMagnitude(m_data))
{
}

float GradientVolume::maxMagnitude() const
{
    return m_maxMagnitude;
}

float GradientVolume::minMagnitude() const
{
    return m_minMagnitude;
}

glm::ivec3 GradientVolume::dims() const
{
    return m_dim;
}

// This function returns a gradientVoxel at coord based on the current interpolation mode.
GradientVoxel GradientVolume::getGradientInterpolate(const glm::vec3& coord) const
{
    switch (interpolationMode) {
    case InterpolationMode::NearestNeighbour: {
        return getGradientNearestNeighbor(coord);
    }
    case InterpolationMode::Linear: {
        return getGradientLinearInterpolate(coord);
    }
    case InterpolationMode::Cubic: {
        // No cubic in this case, linear is good enough for the gradient.
        return getGradientLinearInterpolate(coord);
    }
    default: {
        throw std::exception();
    }
    };
}

// This function returns the nearest neighbour given a position in the volume given by coord.
// Notice that in this framework we assume that the distance between neighbouring voxels is 1 in all directions
GradientVoxel GradientVolume::getGradientNearestNeighbor(const glm::vec3& coord) const
{
    if (glm::any(glm::lessThan(coord, glm::vec3(0))) || glm::any(glm::greaterThanEqual(coord, glm::vec3(m_dim))))
        return { glm::vec3(0.0f), 0.0f };

    auto roundToPositiveInt = [](float f) {
        return static_cast<int>(f + 0.5f);
    };

    return getGradient(roundToPositiveInt(coord.x), roundToPositiveInt(coord.y), roundToPositiveInt(coord.z));
}

// ======= TODO : IMPLEMENT ========
// Returns the trilinearly interpolated gradient at the given coordinate.
// Use the linearInterpolate function that you implemented below.
GradientVoxel GradientVolume::getGradientLinearInterpolate(const glm::vec3& coord) const
{
    int low_x = static_cast<int>(glm::floor(coord.x));
    int high_x = static_cast<int>(glm::ceil(coord.x));

    int low_y = static_cast<int>(glm::floor(coord.y));
    int high_y = static_cast<int>(glm::ceil(coord.y));

    int low_z = static_cast<int>(glm::floor(coord.z));
    int high_z = static_cast<int>(glm::ceil(coord.z));

    // front square
    GradientVoxel front_bottom_left = getGradient(low_x, low_y, low_z);
    GradientVoxel front_bottom_right = getGradient(high_x, low_y, low_z);

    GradientVoxel front_top_left = getGradient(low_x, high_y, low_z);
    GradientVoxel front_top_right = getGradient(high_x, high_y, low_z);
    
    // back square
    GradientVoxel back_bottom_left = getGradient(low_x, low_y, high_z);
    GradientVoxel back_bottom_right = getGradient(high_x, low_y, high_z);
    
    GradientVoxel back_top_left = getGradient(low_x, high_y, high_z);
    GradientVoxel back_top_right = getGradient(high_x, high_y, high_z);

    // interpolations x
    GradientVoxel grad_front_bottom = linearInterpolate(front_bottom_left, front_bottom_right, coord.x - low_x);
    GradientVoxel grad_front_top = linearInterpolate(front_top_left, front_top_right, coord.x - low_x);

    GradientVoxel grad_back_bottom = linearInterpolate(back_bottom_left, back_bottom_right, coord.x- low_x);
    GradientVoxel grad_back_top = linearInterpolate(back_top_left, back_top_right, coord.x - low_x);

    // interpolations y
    GradientVoxel grad_front = linearInterpolate(grad_front_bottom, grad_front_top, coord.y - low_y);
    GradientVoxel grad_back = linearInterpolate(grad_back_bottom, grad_back_top, coord.y - low_y);
    
    // interpolation z
    GradientVoxel grad = linearInterpolate(grad_front, grad_back, coord.z - low_z);
    
    return grad;
}

// ======= TODO : IMPLEMENT ========
// This function should linearly interpolates the value from g0 to g1 given the factor (t).
// At t=0, linearInterpolate should return g0 and at t=1 it returns g1.
GradientVoxel GradientVolume::linearInterpolate(const GradientVoxel& g0, const GradientVoxel& g1, float factor)
{
    glm::vec3 dir = g0.dir + factor * (g1.dir - g0.dir);
    float dist = g0.magnitude + factor * (g1.magnitude - g0.magnitude);     // probably correct?
    return GradientVoxel {dir, dist};
}

// This function returns a gradientVoxel without using interpolation
GradientVoxel GradientVolume::getGradient(int x, int y, int z) const
{
    const size_t i = static_cast<size_t>(x + m_dim.x * (y + m_dim.y * z));
    return m_data[i];
}
}