#version 300 es
precision mediump float;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec4 data;

out float lifetime;
out vec2 v_uv;

void main() {
  vec3 offset = data.xyz;
  lifetime = data.w;
  v_uv = uv;

  gl_PointSize = lifetime;
  gl_Position = vec4(position * 0.01 + offset, 1.0f);
}