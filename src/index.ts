import { createProgram } from "./gl-utils";
import vertexShaderSource from "./shaders/vertex.glsl";
import fragmentShaderSource from "./shaders/fragment.glsl";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("Failed to get WebGL2 context.");
}

const num = 1 << 16;
const size = Math.sqrt(Math.pow(2, Math.ceil(Math.log2(num))));
const total = size * size;

const program = createProgram(gl, vertexShaderSource, fragmentShaderSource, [
  "updated",
]);

// initial data
const data = new Array(total * 4);
for (let i = 0; i < total; i++) {
  data[i * 4] = 0.2 * Math.random() - 0.1; // x: [-0.1, 0.1)
  data[i * 4 + 1] = 1.0; // y: [0, 0.1)
  data[i * 4 + 2] = 0.2 * Math.random() - 0.1; // z: [-0.1, 0.1)
  data[i * 4 + 3] = 5 * Math.random(); // lifetime
}
const buffer = new Float32Array(data);

const save = gl.createTexture();
if (!save) {
  throw new Error("Failed to creare texture");
}
gl.bindTexture(gl.TEXTURE_2D, save);
gl.texImage2D(
  gl.TEXTURE_2D,
  0,
  gl.RGBA16F,
  size,
  size,
  0,
  gl.RGBA,
  gl.FLOAT,
  buffer
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

const vbos = [gl.createBuffer(), gl.createBuffer()];
if (vbos.indexOf(null) != -1) {
  throw new Error("Failed to create buffer");
}
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[0]);
gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.bufferData(gl.ARRAY_BUFFER, data.length * 4, gl.DYNAMIC_COPY);

const vaos = [gl.createVertexArray()];
if (vaos.indexOf(null) !== -1) {
  throw new Error("Failed to create vertex array");
}
gl.bindVertexArray(vaos[0]);
gl.enableVertexAttribArray(0);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[0]);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(vaos[1]);
gl.enableVertexAttribArray(0);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

gl.useProgram(program);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, save);
gl.uniform1i(gl.getUniformLocation(program, "save"), 0);

let swap = false;
function render(gl: WebGL2RenderingContext) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindVertexArray(vaos[swap ? 1 : 0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbos[swap ? 1 : 0]);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, vbos[swap ? 0 : 1]);
  swap = !swap;

  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, total);
  gl.endTransformFeedback();

  window.requestAnimationFrame(() => render(gl));
}

function resize(gl: WebGL2RenderingContext) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

resize(gl);

gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);
render(gl);
window.addEventListener("resize", () => resize(gl));
