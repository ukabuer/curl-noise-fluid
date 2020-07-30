import { vec3, mat4 } from "gl-matrix";

class Camera {
  position: vec3;
  target: vec3;
  up: vec3;

  canvas: HTMLCanvasElement;
  mouseDown: boolean;
  lastMouse: [number, number];
  CAMERA_SENSITIVITY = 0.002;

  readonly projectionMatrix: mat4;
  readonly viewMatrix: mat4;
  readonly matrix: mat4;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.position = vec3.fromValues(0, 0, 5);
    this.target = vec3.fromValues(0, 0, 0);
    this.up = vec3.fromValues(0, 1, 0);
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.matrix = mat4.create();

    this.lastMouse = [0, 0];
    this.mouseDown = false;

    this.addEventListener();
  }

  lookAt = (position: vec3, target: vec3, up: vec3) => {
    this.position = position;
    this.target = target;
    this.up = up;
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    mat4.multiply(this.matrix, this.projectionMatrix, this.viewMatrix);
  };

  perspective = (fovy: number, aspect: number, near: number, far: number) => {
    mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);
    mat4.multiply(this.matrix, this.projectionMatrix, this.viewMatrix);
  };

  addEventListener = () => {
    this.canvas.addEventListener("mousedown", this.onMouseDown);
    document.addEventListener("mousemove", this.onMouseDown);
    this.canvas.addEventListener("mousedown", this.onMouseDown);
  };

  removeEventListener = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onMouseDown);
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
  };

  onMouseDown = (event: MouseEvent) => {
    this.mouseDown = true;
    this.lastMouse = [event.x, event.y];
  };

  onMouseUp = () => {
    this.mouseDown = false;
  };

  onMouseMove = (event: MouseEvent) => {
    if (!this.mouseDown) {
      this.canvas.style.cursor = "grab";
      return;
    }

    const mouseX = event.x;
    const mouseY = event.y;

    const deltaAzimuth = (mouseX - this.lastMouse[0]) * this.CAMERA_SENSITIVITY;
    const deltaElevation =
      (mouseY - this.lastMouse[1]) * this.CAMERA_SENSITIVITY;

    mat4.rotateX(this.viewMatrix, this.viewMatrix, -deltaElevation);
    mat4.rotateY(this.viewMatrix, this.viewMatrix, deltaAzimuth);

    mat4.multiply(this.matrix, this.projectionMatrix, this.viewMatrix);

    this.lastMouse = [mouseX, mouseY];

    this.canvas.style.cursor = "grabbing";
  };
}

export default Camera;
