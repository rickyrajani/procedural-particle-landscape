export const vertexDisplayShader = 
`#version 300 es
layout(location = 0) in vec4 a_position;

uniform float u_particleSize;
uniform mat4 u_viewProjectionMatrix;

void main() {
  gl_Position = u_viewProjectionMatrix * a_position;
  gl_PointSize = u_particleSize;
}
`;