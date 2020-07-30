#version 300 es
precision mediump float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec4 offset;

uniform mat4 camera;

out float lifetime;
out vec2 v_uv;

void main() {
  vec3 pos = position + offset.xyz;
  lifetime = offset.w;
  v_uv = uv;

  gl_Position = camera * vec4(pos, 1.0);
}