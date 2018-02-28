export const vertexFeedbackShader = 
`#version 300 es
  precision highp float;
  layout(location = 0) in vec4 a_position;
  layout(location = 1) in vec3 a_velocity;
  
  flat out vec4 v_position;
  flat out vec3 v_velocity;
  
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform mat4 u_viewProjectionMatrix;
  uniform int u_pause;
  uniform float u_gravity;
  uniform float u_rotation;

  float PARTICLE_MASS = 1.0;
  float DAMPING = 1e-6;
  float PI = 3.14159;
 
  void main() {
    vec2 acceleration = vec2(0.0, 0.0);

    if(u_time > 100.0 && u_pause == 0){
      vec2 gravityCenter = u_mouse;
    
      float r = distance(a_position.xy, gravityCenter);
      vec2 direction = gravityCenter - a_position.xy;
      float force = PARTICLE_MASS * u_gravity / (r * r) * DAMPING;
      float maxForce = min(force, DAMPING * 10.0);

      acceleration = (force / PARTICLE_MASS * direction) / 2.0;
    }

    vec2 newVelocity = a_velocity.xy + acceleration;
    vec2 newPositionXY = a_position.xy + newVelocity;    
    vec3 newPosition = vec3(newPositionXY, a_position.z);

    // Rotate objects
    newPosition.x = newPosition.x * cos(PI/350.0) - newPosition.z * sin(PI/u_rotation);
    newPosition.z = newPosition.x * sin(PI/350.0) + newPosition.z * cos(PI/u_rotation);

    v_velocity = vec3(newVelocity * 0.99, a_velocity.z);
    v_position = vec4(newPosition, 1.0);

    // Bounce at borders
    if (v_position.x > 1.0 || v_position.x < -1.0) {
      v_velocity.x *= -0.5;
    }
    
    if (v_position.y > 1.0 || v_position.y < -1.0) {
      v_velocity.y *= -0.5;
    }
  }
`;
