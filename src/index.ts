import { createProgram } from "./gl-utils";
import vertexShaderSource from "./shaders/vertex.glsl";
import fragmentShaderSource from "./shaders/fragment.glsl";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("Failed to get WebGL2 context.");
}

function resize(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}

function init(gl: WebGL2RenderingContext) {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);
}

function render(gl: WebGL2RenderingContext) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

  window.requestAnimationFrame(() => render(gl));
}

resize(canvas);
init(gl);
const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);

const vbo = gl.createBuffer();
if (!vbo) {
  throw new Error("Failed to create buffer");
}
gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
// prettier-ignore
const vertices = new Float32Array([
     0,  1, -1, 1, 0, 0,
    -1, -1, -1, 0, 1, 0,
     1, -1, -1, 0, 0, 1,
  ]);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const vao = gl.createVertexArray();
if (!vao) {
  throw new Error("Failed to create vertex array");
}

gl.bindVertexArray(vao);
gl.enableVertexAttribArray(0);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * 4, 0);
gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * 4, 3 * 4);

gl.useProgram(program);

window.requestAnimationFrame(() => render(gl));
window.addEventListener("resize", () => resize(canvas));
