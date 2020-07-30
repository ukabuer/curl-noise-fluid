export function createShader(
  gl: WebGLRenderingContext,
  type: GLenum,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) return 0;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const err = gl.getShaderInfoLog(shader);
    throw new Error(err || "");
  }

  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader | string,
  fragmentShader: WebGLShader | string,
  feedbacks?: string[]
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
  if (!program || !v || !f) return 0;

  gl.attachShader(program, v);
  gl.attachShader(program, f);

  if (feedbacks) {
    gl.transformFeedbackVaryings(program, feedbacks, gl.INTERLEAVED_ATTRIBS);
  }

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error("Failed to create shader program");
  }

  return program;
}
