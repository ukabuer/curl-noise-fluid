import { mat4, vec3 } from "gl-matrix";
import { createProgram } from "./gl-utils";
import renderVertexShader from "./shaders/render_vs.glsl";
import renderFragmentShader from "./shaders/render_fs.glsl";
import updateVertexShader from "./shaders/update_vs.glsl";
import updatefragmentShader from "./shaders/update_fs.glsl";
import Camera from "./Camera";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("Failed to get WebGL2 context.");
}

const num = 1 << 10;
const size = Math.sqrt(Math.pow(2, Math.ceil(Math.log2(num))));
const total = size * size;

const camera = new Camera();
camera.lookAt(
  vec3.fromValues(0, 0, 20),
  vec3.fromValues(0, 0, 0),
  vec3.fromValues(0, 1, 0)
);
camera.perspective(45.0, canvas.width / canvas.height, 1.0, 100.0);

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

// initial data
const data = new Array(total * 4);
for (let i = 0; i < total; i++) {
  data[i * 4] = 0.2 * (Math.random() - 0.5);
  data[i * 4 + 1] = -6.0 * Math.random() - 6; // y: [0, 0.1)
  data[i * 4 + 2] = 0.2 * Math.random() - 0.1; // z: [-0.1, 0.1)
  data[i * 4 + 3] = 0.5 + Math.random() * 0.5;
}
const buffer = new Float32Array(data);

// prettier-ignore
const quad = [
  -1, -1, 0, 0, 0,
  1, -1, 0, 1, 0,
  -1, 1, 0, 0, 1,
  -1, 1, 0, 0, 1,
  1, -1, 0, 1, 0,
  1, 1, 0, 1, 1,
];

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

const vbos = [gl.createBuffer(), gl.createBuffer(), gl.createBuffer()];
if (vbos.indexOf(null) != -1) {
  throw new Error("Failed to create buffer");
}
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[0]);
gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.bufferData(gl.ARRAY_BUFFER, data.length * 4, gl.DYNAMIC_COPY);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[2]);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quad), gl.STATIC_DRAW);

const vaos = [
  gl.createVertexArray(),
  gl.createVertexArray(),
  gl.createVertexArray(),
];
if (vaos.indexOf(null) !== -1) {
  throw new Error("Failed to create vertex array");
}
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[0]);
gl.bindVertexArray(vaos[0]);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.bindVertexArray(vaos[1]);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(vaos[2]);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[2]);
gl.enableVertexAttribArray(0);
gl.vertexAttribPointer(0, 3, gl.FLOAT, false, (3 + 2) * 4, 0);
gl.enableVertexAttribArray(1);
gl.vertexAttribPointer(1, 2, gl.FLOAT, false, (3 + 2) * 4, 3 * 4);
gl.bindBuffer(gl.ARRAY_BUFFER, vbos[1]);
gl.enableVertexAttribArray(2);
gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
gl.vertexAttribDivisor(2, 1);

gl.useProgram(updateProgram);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D, save);
gl.uniform1i(gl.getUniformLocation(updateProgram, "save"), 0);

gl.useProgram(renderProgram);
gl.uniform1i(gl.getUniformLocation(renderProgram, "sprite"), 1);

let swap = false;
function render(gl: WebGL2RenderingContext) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(updateProgram);
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
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.useProgram(renderProgram);
  gl.uniformMatrix4fv(
    gl.getUniformLocation(renderProgram, "camera"),
    false,
    camera.matrix
  );
  gl.bindVertexArray(vaos[2]);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, total);
  gl.disable(gl.BLEND);

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

const particle_tex = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4QYTCCY1R1556QAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAC4ElEQVRYw8VXa4/aMBAcB0OgB0ff///vVWpV0UAOcBz3w832hr0EyLVSLa0S7mLPePbhdcAbRykl2HsIobx1nTARMIzMVQJlCqEwATgAmMmcSj7rhUjm8y4iYQLwjKDxCoGO7/leIuEKeCXAkTZzZiM762j2ux8jEW+Az2kRwIIWxSA7NzvTZgCSrDtIIt4Ar/lcAVjSjNBcpiaCJwBH2pNz0yCJOOASBV/yueb7O5qpYcN23YpqAcDJC+wy5oXAwO4XBH0AsAGwJZG1/M/GkQT2tJ1sqFcrpVwEpSpQSZSb7Ab+HsAHIbKhMjZOABr+bTFQI7LLjHxBQFLO734l4F8APPK5ohI29iRWO2U0MC07+mcRnlWIIpWmXS0+3xB4C+ArgM/iCiWw5xrm+44xkfjbMiPTHYMEouT9gi5YO/BPVMRSsuM3P51LLCae3LqdumgsC6LLhC3VeATwkU9LSUu9wPeW3zeSxtGV8ZcsEP9X4oYosVC7gKxJ5kEIVNz1hsArCUglYBjB4iCOlGe1SpSpJM9tdxXlnssGdJ7a7VJ8x7Ag6giiB9DkEUMIpZRSXMHIUlq1yrUMOPW5xUCSb2xOkkNJ1y8+Df0OFdyKzJZRXYvPo+T5TqK+kUxQEqMusBrdOQItgAMXX4p/E4MwcN6BoD8AfOf3B6kDuu7FeaAEtJE40Vou7Gv/nhFvo6EbvhG8obWyVvZF6A8BxoH5J3GnR/5/5ypcIvjOHUYNi5E9d3THUVzR++YkurbKy++7prP425+GRmJPAr/43g4E4+s0pAomU5KioQfLgTbWD+wlE8wtploGkG81JBaIcOc5JNq16dCOyLLGuqFWsihJAI4XIlEBzjW9LB6lvKo6BnISRS7S8GZPOEJCY+N8R1fciSL5Gvg99wJ/QFUi/dC9IEmZzkNR/5abUTVwII0R6KXt6kMI/T+5G7pbUrhyNyxTrmWTLqcDt+JXBP7mlvzfxm8amZhMH7WSmQAAAABJRU5ErkJggg==`;

const part_img = new Image();
part_img.src = particle_tex;
part_img.onload = () => {
  const sprite = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, sprite);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA8,
    32,
    32,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    part_img
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  render(gl);
};

window.addEventListener("resize", () => resize(gl));

let mouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let CAMERA_SENSITIVITY = 0.002;

canvas.addEventListener("mousedown", function (event) {
  mouseDown = true;
  lastMouseX = event.x;
  lastMouseY = event.y;
});

document.addEventListener("mouseup", function (event) {
  mouseDown = false;
});

canvas.addEventListener("mousemove", function (event) {
  if (mouseDown) {
    var mouseX = event.x;
    var mouseY = event.y;

    var deltaAzimuth = (mouseX - lastMouseX) * CAMERA_SENSITIVITY;
    var deltaElevation = (mouseY - lastMouseY) * CAMERA_SENSITIVITY;

    mat4.rotateX(camera.viewMatrix, camera.viewMatrix, -deltaElevation);
    mat4.rotateY(camera.viewMatrix, camera.viewMatrix, deltaAzimuth);

    mat4.multiply(camera.matrix, camera.projectionMatrix, camera.viewMatrix);

    lastMouseX = mouseX;
    lastMouseY = mouseY;

    canvas.style.cursor = "grabbing";
  } else {
    canvas.style.cursor = "grab";
  }
});

canvas.addEventListener("wheel", (event: WheelEvent) => {
  const delta = event.deltaY / 120;
  if (delta < 0) {
    camera.position[2] += 0.25;
  } else {
    camera.position[2] -= 0.25;
  }
  console.log(camera.position);
  mat4.lookAt(camera.viewMatrix, camera.position, camera.target, camera.up);
  mat4.multiply(camera.matrix, camera.projectionMatrix, camera.viewMatrix);
});
