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
  // vec4 color = vec4(vec3(0.74, 42.0 / 255.0,42.0 / 255.0), 0.01);
  // FragColor = color * texture(sprite, v_uv);
  FragColor = vec4(
    palette(lifetime / 5.0,
            vec3(0.5,0.5,0.5),
            vec3(0.5,0.5,0.5),
            vec3(1.0,0.7,0.4),
            vec3(0.0,0.15,0.20)),
    1.0 - lifetime / 5.0
  );
}