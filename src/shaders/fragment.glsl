#version 300 es
precision mediump float;

in float lifetime;

out vec4 FragColor;

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  FragColor = vec4(
    palette(lifetime / 5.0,
            vec3(0.5,0.5,0.5),
            vec3(0.5,0.5,0.5),
            vec3(1.0,0.7,0.4),
            vec3(0.0,0.15,0.20)),
    1.0 - lifetime / 5.0
  );
}