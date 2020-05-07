layout(location = 0) in vec3 position;
layout(location = 1) in vec2 texcoord;

layout(location = 0) uniform mat4 camera_matrix;

out vec2 v_texcoord;

void main() {
  v_texcoord = texcoord;
  gl_Position = vec4(camera_matrix * position, 1.0f);
}