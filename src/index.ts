import { vec3 } from "gl-matrix";
import { createProgram } from "./utils";
import renderVertexShader from "./shaders/render_vs.glsl";
import renderFragmentShader from "./shaders/render_fs.glsl";
import updateVertexShader from "./shaders/update_vs.glsl";
import updatefragmentShader from "./shaders/update_fs.glsl";
import TrackballCamera from "./Camera";
const dat = require("dat.gui");
const Stats = require("stats.js");

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("Failed to get WebGL2 context.");
}

const num = 1 << 16;
const size = Math.sqrt(Math.pow(2, Math.ceil(Math.log2(num))));
const total = size * size;
const sphere = {
  x: 0,
  y: 0,
  z: 0,
  radius: 3,
};

const camera = new TrackballCamera(canvas);
camera.lookAt(
  vec3.fromValues(0, 0, 16),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 1, 0)
);

const updateProgram = createProgram(
  gl,
  updateVertexShader,
  updatefragmentShader,
  ["updated"]
);
const renderProgram = createProgram(
  gl,
  renderVertexShader,
  renderFragmentShader
);

// initial positions
const data = new Array(total * 4);
for (let i = 0; i < total; i++) {
  const idx = i * 4;
  data[idx] = 0.2 * Math.random() - 0.1;
  data[idx + 1] = -6 * Math.random() - 6;
  data[idx + 2] = 0.2 * Math.random() - 0.1;
  data[idx + 3] = 0.5 + Math.random() * 0.5;
}
const initial = new Float32Array(data);

const vbos = [gl.createBuffer(), gl.createBuffer(), gl.createBuffer()];
if (vbos.indexOf(null) != -1) {
  throw new Error("Failed to create buffer");
}
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[0]);
gl.bufferData(gl.ARRAY_BUFFER, initial, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.bufferData(gl.ARRAY_BUFFER, data.length * 4, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[2]);
gl.bufferData(gl.ARRAY_BUFFER, initial, gl.STATIC_DRAW);

const vaos = [gl.createVertexArray(), gl.createVertexArray()];
if (vaos.indexOf(null) !== -1) {
  throw new Error("Failed to create vertex array");
}
gl.bindVertexArray(vaos[0]);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[0]);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[2]);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(vaos[1]);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[2]);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(vaos[2]);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(0, 1);

gl.useProgram(renderProgram);
gl.uniform1f(gl.getUniformLocation(renderProgram, "size"), 1.0);

// begin ui
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const gui = new dat.GUI();
gui.add(sphere, "radius", 2, 6);
gui.add(sphere, "x", -3, 3);
gui.add(sphere, "y", -2, 2);
// end ui

let swap = false;
function render(gl: WebGL2RenderingContext) {
  stats.begin();

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(updateProgram);
  gl.uniform4fv(gl.getUniformLocation(updateProgram, "sphere"), [
    sphere.x,
    sphere.y,
    sphere.z,
    sphere.radius,
  ]);
  gl.bindVertexArray(vaos[swap ? 1 : 0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbos[swap ? 1 : 0]);
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, vbos[swap ? 0 : 1]);
  swap = !swap;

  gl.enable(gl.RASTERIZER_DISCARD);
  gl.beginTransformFeedback(gl.POINTS);
  gl.drawArrays(gl.POINTS, 0, total);
  gl.endTransformFeedback();
  gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
  gl.disable(gl.RASTERIZER_DISCARD);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.useProgram(renderProgram);
  camera.update();
  gl.uniformMatrix4fv(
    gl.getUniformLocation(renderProgram, "camera"),
    false,
    camera.matrix
  );
  gl.bindVertexArray(vaos[2]);
  gl.drawArraysInstanced(gl.POINTS, 0, 1, total);

  stats.end();
  window.requestAnimationFrame(() => render(gl));
}

function resize(gl: WebGL2RenderingContext) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
  camera.perspective(Math.PI / 4, canvas.width / canvas.height, 1.0, 100.0);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

gl.clearColor(0, 0, 0, 1);
resize(gl);
render(gl);

window.addEventListener("resize", () => resize(gl));
