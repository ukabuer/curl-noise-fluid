#version 300 es
precision mediump float;

in float lifetime;
in vec2 v_uv;

uniform sampler2D sprite;

out vec4 FragColor;

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec4 color = vec4(vec3(0.74, 42.0 / 255.0,42.0 / 255.0), 0.1);
  FragColor = color * texture(sprite, v_uv);
}