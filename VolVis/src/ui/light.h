#pragma once
#include "render/render_config.h"
#include "volume/volume.h"
#include <GL/glew.h> // Include before glfw3
#include <glm/vec2.hpp>
#include <glm/vec3.hpp>
#include <glm/vec4.hpp>
#include <vector>

namespace ui {
class LightWidget {
public:
    LightWidget(render::RenderConfig& renderConfig);

    void draw();
    void updateRenderConfig(render::RenderConfig& renderConfig) const;

private:
    glm::vec3 m_direction;
    glm::vec3 m_colour;
};
}