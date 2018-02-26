export const fragmentPostShader = 
`#version 300 es
precision lowp float;

uniform sampler2D tex;
uniform float brightness;
uniform float colorIntensity;

in vec2 v_uv;
out vec4 color;

void main() {
  vec4 texColor = texture(tex, v_uv / 2.0 + 0.5);
  color = texColor;
  float intensity = 1.0 - texColor.r;
  if (intensity > brightness) {
    vec3 blendValues = vec3(
      smoothstep(colorIntensity + 0.1, 1.0, intensity),
      smoothstep(colorIntensity, 1.0, intensity),
      intensity
    );
    vec3 highlightColor = mix(color.rgb, vec3(1.0), blendValues);
    color = vec4(highlightColor, 1);
  }
}
`;