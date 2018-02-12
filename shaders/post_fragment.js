export const fragmentPostShader = 
`#version 300 es
precision lowp float;
uniform sampler2D tex;
in vec2 v_uv;
out vec4 color;

void main() {
  vec4 texColor = texture(tex, v_uv / 2.0 + 0.5);
  color = texColor;
  float intensity = 1.0 - texColor.r;
  if (intensity > 0.8) {
    vec3 blendValues = vec3(
      smoothstep(0.8, 1.0, intensity),
      smoothstep(0.7, 1.0, intensity),
      intensity
    );
    vec3 highlightColor = mix(color.rgb, vec3(1.0), blendValues);
    color = vec4(highlightColor, 1);
  }
}
`;