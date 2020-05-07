import { vec3, mat4 } from "gl-matrix";

class Camera {
  position: vec3;
  target: vec3;
  up: vec3;
  readonly projectionMatrix: mat4;
  readonly viewMatrix: mat4;
  readonly matrix: mat4;

  constructor() {
    this.position = vec3.fromValues(0, 0, 5);
    this.target = vec3.fromValues(0, 0, 0);
    this.up = vec3.fromValues(0, 1, 0);
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.matrix = mat4.create();
  }

  lookAt = (position: vec3, target: vec3, up: vec3) => {
    this.position = position;
    this.target = target;
    this.up = up;
    mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
    mat4.multiply(this.matrix, this.projectionMatrix, this.viewMatrix);
  };

  project = (fovy: number, aspect: number, near: number, far: number) => {
    mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);
    mat4.multiply(this.matrix, this.projectionMatrix, this.viewMatrix);
  };
}

export default Camera;
