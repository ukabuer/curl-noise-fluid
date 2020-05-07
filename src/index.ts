import { createShader, createProgram } from "./gl-utils";
import Camera from "./Camera";
import TrackballController from "./TrackballController";
import { vec3, mat4 } from "gl-matrix";

function resize(canvas: HTMLCanvasElement) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.width = `${canvas.width}px`;
  canvas.style.height = `${canvas.height}px`;
}

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
resize(canvas);

const gl = canvas.getContext("webgl2");

function setupGL(gl: WebGL2RenderingContext) {
  gl.enable(gl.DEPTH_TEST);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 1);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  window.requestAnimationFrame(render);
}

window.requestAnimationFrame(render);
window.addEventListener("resize", () => resize(canvas));
