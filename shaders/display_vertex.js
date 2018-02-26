export const vertexDisplayShader = 
`#version 300 es
layout(location = 0) in vec4 a_position;

uniform float u_particleSize;

void main() {
  gl_Position = a_position;
  gl_PointSize = u_particleSize;
}
`;