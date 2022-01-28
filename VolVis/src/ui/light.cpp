#include "ui/light.h"
#include <imgui.h>
#include <iostream>

namespace ui {
    LightWidget::LightWidget(render::RenderConfig& renderConfig)
    : m_direction(renderConfig.lightDirection)
    , m_colour(renderConfig.lightColour)
{

}

    void LightWidget::draw()
    {
        ImGui::Text("Lighting Settings");
        ImGui::TextWrapped("Modify the direction and colour of the light in render modes which use phong shading.");
        
        ImGui::NewLine();

        ImGui::InputFloat3("Direction", &m_direction.x);

        ImGui::NewLine();

        ImGui::InputFloat3("Colour", &m_colour.r);

    }

    void LightWidget::updateRenderConfig(render::RenderConfig& renderConfig) const
    {
        if (!(m_direction.x == 0 && m_direction.y == 0 && m_direction.z == 0)) {
            renderConfig.lightDirection = m_direction;
        }
        renderConfig.lightColour = m_colour;
    }
}