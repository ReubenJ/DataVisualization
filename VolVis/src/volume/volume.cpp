#include "volume.h"
#include <algorithm>
#include <array>
#include <cassert>
#include <cctype> // isspace
#include <chrono>
#include <filesystem>
#include <fstream>
#include <glm/glm.hpp>
#include <gsl/span>
#include <iostream>
#include <string>

struct Header {
    glm::ivec3 dim;
    size_t elementSize;
};
static Header readHeader(std::ifstream& ifs);
static float computeMinimum(gsl::span<const uint16_t> data);
static float computeMaximum(gsl::span<const uint16_t> data);
static std::vector<int> computeHistogram(gsl::span<const uint16_t> data);

namespace volume {

Volume::Volume(const std::filesystem::path& file)
    : m_fileName(file.string())
{
    using clock = std::chrono::high_resolution_clock;
    auto start = clock::now();
    loadFile(file);
    auto end = clock::now();
    std::cout << "Time to load: " << std::chrono::duration<double, std::milli>(end - start).count() << "ms" << std::endl;

    if (m_data.size() > 0) {
        m_minimum = computeMinimum(m_data);
        m_maximum = computeMaximum(m_data);
        m_histogram = computeHistogram(m_data);
    }
}

Volume::Volume(std::vector<uint16_t> data, const glm::ivec3& dim)
    : m_fileName()
    , m_elementSize(2)
    , m_dim(dim)
    , m_data(std::move(data))
    , m_minimum(computeMinimum(m_data))
    , m_maximum(computeMaximum(m_data))
    , m_histogram(computeHistogram(m_data))
{
}

float Volume::minimum() const
{
    return m_minimum;
}

float Volume::maximum() const
{
    return m_maximum;
}

std::vector<int> Volume::histogram() const
{
    return m_histogram;
}

glm::ivec3 Volume::dims() const
{
    return m_dim;
}

std::string_view Volume::fileName() const
{
    return m_fileName;
}

float Volume::getVoxel(int x, int y, int z) const
{
    const size_t i = size_t(x + m_dim.x * (y + m_dim.y * z));
    return static_cast<float>(m_data[i]);
}

// This function returns a value based on the current interpolation mode
float Volume::getSampleInterpolate(const glm::vec3& coord) const
{
    switch (interpolationMode) {
    case InterpolationMode::NearestNeighbour: {
        return getSampleNearestNeighbourInterpolation(coord);
    }
    case InterpolationMode::Linear: {       
        return getSampleTriLinearInterpolation(coord);
    }
    case InterpolationMode::Cubic: {
        return getSampleTriCubicInterpolation(coord);
    }
    default: {
        throw std::exception();
    }
    }
}

// This function returns the nearest neighbour value at the continuous 3D position given by coord.
// Notice that in this framework we assume that the distance between neighbouring voxels is 1 in all directions
float Volume::getSampleNearestNeighbourInterpolation(const glm::vec3& coord) const
{
    // check if the coordinate is within volume boundaries, since we only look at direct neighbours we only need to check within 0.5
    if (glm::any(glm::lessThan(coord + 0.5f, glm::vec3(0))) || glm::any(glm::greaterThanEqual(coord + 0.5f, glm::vec3(m_dim))))
        return 0.0f;

    // nearest neighbour simply rounds to the closest voxel positions
    auto roundToPositiveInt = [](float f) {
        // rounding is equal to adding 0.5 and cutting off the fractional part
        return static_cast<int>(f + 0.5f);
    };

    return getVoxel(roundToPositiveInt(coord.x), roundToPositiveInt(coord.y), roundToPositiveInt(coord.z));
}

// ======= TODO : IMPLEMENT the functions below for tri-linear interpolation ========
// ======= Consider using the linearInterpolate and biLinearInterpolate functions ===
// This function returns the trilinear interpolated value at the continuous 3D position given by coord.
float Volume::getSampleTriLinearInterpolation(const glm::vec3& coord) const
{
    // check if the coordinate is within volume boundaries
    if (glm::any(glm::lessThan(coord, glm::vec3(0))) || glm::any(glm::greaterThanEqual(coord, glm::vec3(m_dim))))
        return 0.0f;

    // Get two points to bilinearly interpolate
    int low_z = static_cast<int>(glm::floor(coord.z));
    int high_z = static_cast<int>(glm::ceil(coord.z));

    glm::vec2 xyCoord{coord.x, coord.y};
    float low_zInterpolation = biLinearInterpolate(xyCoord, low_z);
    float high_zInterpolation = biLinearInterpolate(xyCoord, high_z);

    // lin interpolate between two results
    float result = linearInterpolate(low_zInterpolation, high_zInterpolation, coord.z - low_z);

    return result;
}

// This function linearly interpolates the value at X using incoming values g0 and g1 given a factor (equal to the positon of x in 1D)
//
// g0--X--------g1
//   factor
float Volume::linearInterpolate(float g0, float g1, float factor)
{
    return g0 + ((g1-g0) * factor);
}

// This function bi-linearly interpolates the value at the given continuous 2D XY coordinate for a fixed integer z coordinate.
float Volume::biLinearInterpolate(const glm::vec2& xyCoord, int z) const
{
    int tx = static_cast<int>(glm::ceil(xyCoord.x));
    int ty = static_cast<int>(glm::ceil(xyCoord.y));
    int bx = static_cast<int>(glm::floor(xyCoord.x));
    int by = static_cast<int>(glm::floor(xyCoord.y));

    float tx_ty = getVoxel(tx, ty, z);
    float tx_by = getVoxel(tx, by, z);
    float bx_ty = getVoxel(bx, ty, z);
    float bx_by = getVoxel(bx, by, z);

    // Between tx_ty and bx_ty
    float topPoint = linearInterpolate(bx_ty, tx_ty, xyCoord.x - bx);
    float botPoint = linearInterpolate(bx_by, tx_by, xyCoord.x - bx);

    // Between topPoint botPoint
    float returnPoint = linearInterpolate(botPoint, topPoint, xyCoord.y - by);
    
    return returnPoint;
}


// ======= OPTIONAL : This functions can be used to implement cubic interpolation ========
// This function represents the h(x) function, which returns the weight of the cubic interpolation kernel for a given position x
float Volume::weight(float x)
{
    const float a = -1.0; // kernel parameter
    float abs_x = glm::abs(x);
    
    
    float xpow3 = glm::pow(abs_x, 3.0f);
    float xpow2 = glm::pow(abs_x, 2.0f);
    if (abs_x >= 0.0f && abs_x < 1.0f) {
        return (a + 2.0f) * xpow3 - (a + 3.0f) * xpow2 + 1.0f;
    } else if (abs_x >= 1.0f && abs_x < 2.0f) {
        return a * xpow3 - 5.0f * a * xpow2 + 8.0f * a * abs_x - 4.0f * a;
    } // else if (abs_x >= 2.0f)  <-- (implied)
    return 0.0;
}

// ======= OPTIONAL : This functions can be used to implement cubic interpolation ========
// This functions returns the results of a cubic interpolation using 4 values and a factor
// g0-----------g1--X--------g2-----------g3
//                 factor
// factor of 0 means exactly g1 and factor of 1 means exactly g2
float Volume::cubicInterpolate(float g0, float g1, float g2, float g3, float factor)
{
    float w0 = weight(-1.0f - factor);
    float w1 = weight(-factor);
    float w2 = weight(1-factor);
    float w3 = weight(1.0f + (1.0f - factor));

    return w0 * g0 + w1 * g1 + w2 * g2 + w3 * g3;
}

// ======= OPTIONAL : This functions can be used to implement cubic interpolation ========
// This function returns the value of a bicubic interpolation
float Volume::biCubicInterpolate(const glm::vec2& xyCoord, int z) const
{
    // Four x sample points
    int x0 = static_cast<int>(glm::floor(xyCoord.x) - 1);
    int x1 = static_cast<int>(glm::floor(xyCoord.x));
    int x2 = static_cast<int>(glm::ceil(xyCoord.x));
    int x3 = static_cast<int>(glm::ceil(xyCoord.x) + 1);

    // 4 y sample points
    int y0 = static_cast<int>(glm::floor(xyCoord.y) - 1);
    int y1 = static_cast<int>(glm::floor(xyCoord.y));
    int y2 = static_cast<int>(glm::ceil(xyCoord.y));
    int y3 = static_cast<int>(glm::ceil(xyCoord.y) + 1);

    float x1f = static_cast<float>(x1);

    // cubic interpolation across x axis for 4 different y levels
    float x_y0 = cubicInterpolate(getVoxel(x0, y0, z), getVoxel(x1, y0, z), getVoxel(x2, y0, z), getVoxel(x3, y0, z), xyCoord.x - x1f);
    float x_y1 = cubicInterpolate(getVoxel(x0, y1, z), getVoxel(x1, y1, z), getVoxel(x2, y1, z), getVoxel(x3, y1, z), xyCoord.x - x1f);
    float x_y2 = cubicInterpolate(getVoxel(x0, y2, z), getVoxel(x1, y2, z), getVoxel(x2, y2, z), getVoxel(x3, y2, z), xyCoord.x - x1f);
    float x_y3 = cubicInterpolate(getVoxel(x0, y3, z), getVoxel(x1, y3, z), getVoxel(x2, y3, z), getVoxel(x3, y3, z), xyCoord.x - x1f);

    // cubic interpolation across 4 different y levels
    return cubicInterpolate(x_y0, x_y1, x_y2, x_y3, xyCoord.y - static_cast<float>(y1));
}

// ======= OPTIONAL : This functions can be used to implement cubic interpolation ========
// This function computes the tricubic interpolation at coord
float Volume::getSampleTriCubicInterpolation(const glm::vec3& coord) const
{
    // check if the coordinate is within volume boundaries, -1 and +1 for the 2 extra sample points
    if (glm::any(glm::lessThan(coord - 1.0f, glm::vec3(0))) || glm::any(glm::greaterThanEqual(coord + 1.0f, glm::vec3(m_dim))))
        return 0.0f;
    
    // Get four points to cubicly interpolate
    int z0 = static_cast<int>(glm::floor(coord.z)) - 1;
    int z1 = static_cast<int>(glm::floor(coord.z));
    int z2 = static_cast<int>(glm::ceil(coord.z));
    int z3 = static_cast<int>(glm::ceil(coord.z)) + 1;

    glm::vec2 xyCoord{coord.x, coord.y};
    float z0_interpolation = biCubicInterpolate(xyCoord, z0);
    float z1_interpolation = biCubicInterpolate(xyCoord, z1);
    float z2_interpolation = biCubicInterpolate(xyCoord, z2);
    float z3_interpolation = biCubicInterpolate(xyCoord, z3);

    // lin interpolate between four results
    float result = cubicInterpolate(z0_interpolation, z1_interpolation, z2_interpolation, z3_interpolation, coord.z - static_cast<float>(z1));

    return result;
}

// Load an fld volume data file
// First read and parse the header, then the volume data can be directly converted from bytes to uint16_ts
void Volume::loadFile(const std::filesystem::path& file)
{
    assert(std::filesystem::exists(file));
    std::ifstream ifs(file, std::ios::binary);
    assert(ifs.is_open());

    const auto header = readHeader(ifs);
    m_dim = header.dim;
    m_elementSize = header.elementSize;

    const size_t voxelCount = static_cast<size_t>(header.dim.x * header.dim.y * header.dim.z);
    const size_t byteCount = voxelCount * header.elementSize;
    std::vector<char> buffer(byteCount);
    // Data section is separated from header by two /f characters.
    ifs.seekg(2, std::ios::cur);
    ifs.read(buffer.data(), std::streamsize(byteCount));

    m_data.resize(voxelCount);
    if (header.elementSize == 1) { // Bytes.
        for (size_t i = 0; i < byteCount; i++) {
            m_data[i] = static_cast<uint16_t>(buffer[i] & 0xFF);
        }
    } else if (header.elementSize == 2) { // uint16_ts.
        for (size_t i = 0; i < byteCount; i += 2) {
            m_data[i / 2] = static_cast<uint16_t>((buffer[i] & 0xFF) + (buffer[i + 1] & 0xFF) * 256);
        }
    }
}
}

static Header readHeader(std::ifstream& ifs)
{
    Header out {};

    // Read input until the data section starts.
    std::string line;
    while (ifs.peek() != '\f' && !ifs.eof()) {
        std::getline(ifs, line);
        // Remove comments.
        line = line.substr(0, line.find('#'));
        // Remove any spaces from the string.
        // https://stackoverflow.com/questions/83439/remove-spaces-from-stdstring-in-c
        line.erase(std::remove_if(std::begin(line), std::end(line), ::isspace), std::end(line));
        if (line.empty())
            continue;

        const auto separator = line.find('=');
        const auto key = line.substr(0, separator);
        const auto value = line.substr(separator + 1);

        if (key == "ndim") {
            if (std::stoi(value) != 3) {
                std::cout << "Only 3D files supported\n";
            }
        } else if (key == "dim1") {
            out.dim.x = std::stoi(value);
        } else if (key == "dim2") {
            out.dim.y = std::stoi(value);
        } else if (key == "dim3") {
            out.dim.z = std::stoi(value);
        } else if (key == "nspace") {
        } else if (key == "veclen") {
            if (std::stoi(value) != 1)
                std::cerr << "Only scalar m_data are supported" << std::endl;
        } else if (key == "data") {
            if (value == "byte") {
                out.elementSize = 1;
            } else if (value == "short") {
                out.elementSize = 2;
            } else {
                std::cerr << "Data type " << value << " not recognized" << std::endl;
            }
        } else if (key == "field") {
            if (value != "uniform")
                std::cerr << "Only uniform m_data are supported" << std::endl;
        } else if (key == "#") {
            // Comment.
        } else {
            std::cerr << "Invalid AVS keyword " << key << " in file" << std::endl;
        }
    }
    return out;
}

static float computeMinimum(gsl::span<const uint16_t> data)
{
    return float(*std::min_element(std::begin(data), std::end(data)));
}

static float computeMaximum(gsl::span<const uint16_t> data)
{
    return float(*std::max_element(std::begin(data), std::end(data)));
}

static std::vector<int> computeHistogram(gsl::span<const uint16_t> data)
{
    std::vector<int> histogram(size_t(*std::max_element(std::begin(data), std::end(data)) + 1), 0);
    for (const auto v : data)
        histogram[v]++;
    return histogram;
}
