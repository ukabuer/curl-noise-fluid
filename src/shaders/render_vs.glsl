#version 300 es
precision mediump float;

layout(location = 0) in vec4 offset;

uniform mat4 camera;
uniform float size;

void main() {
  vec3 pos = offset.xyz;

  gl_PointSize = size;
  gl_Position = camera * vec4(pos, 1.0);
}