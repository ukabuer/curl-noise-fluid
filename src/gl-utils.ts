export function createShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }

  return shader;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader | string,
  fragmentShader: WebGLShader | string
) {
  const v =
    typeof vertexShader === "string"
      ? createShader(gl, gl.VERTEX_SHADER, vertexShader)
      : vertexShader;
  const f =
    typeof fragmentShader === "string"
      ? createShader(gl, gl.FRAGMENT_SHADER, fragmentShader)
      : fragmentShader;

  const program = gl.createProgram();
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Failed to create shader program");
  }

  return program;
}
