import { vec2, vec3, mat4, quat } from "gl-matrix";

function getCursorPos(e: MouseEvent | TouchEvent): vec2 {
  if ((e as TouchEvent).touches) {
    return vec2.fromValues(
      (e as TouchEvent).touches[0].pageX,
      (e as TouchEvent).touches[0].pageY
    );
  }

  return vec2.fromValues((e as MouseEvent).clientX, (e as MouseEvent).clientY);
}

class TrackballCamera {
  private position: vec3;
  private target: vec3;
  private up: vec3;

  private canvas: HTMLCanvasElement;
  private zoomEnd: number;
  private zoomStart: number;
  private easing: number;
  private lastAxis: vec3;
  private lastAngle: number;

  private box: DOMRect;

  private isMouseDown: boolean;
  private mousePos: vec2;
  private prevMousePos: vec2;

  readonly projectionMatrix: mat4;
  readonly viewMatrix: mat4;
  readonly matrix: mat4;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.box = this.canvas.getBoundingClientRect();
    this.position = vec3.fromValues(0, 0, 5);
    this.target = vec3.fromValues(0, 0, 0);
    this.up = vec3.fromValues(0, 1, 0);
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.matrix = mat4.create();

    this.easing = 0.1;
    this.isMouseDown = false;
    this.prevMousePos = vec2.fromValues(0, 0);
    this.mousePos = vec2.fromValues(0, 0);
    this.zoomStart = 0;
    this.zoomEnd = 0;
    this.lastAxis = vec3.create();
    this.lastAngle = 0;

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
    document.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    this.canvas.addEventListener("wheel", this.onWheel);

    this.canvas.addEventListener("touchstart", this.onMouseDown);
    document.addEventListener("touchmove", this.onMouseMove);
    this.canvas.addEventListener("touchend", this.onMouseUp);
  };

  removeEventListener = () => {
    this.canvas.removeEventListener("mousedown", this.onMouseDown);
    document.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseup", this.onMouseUp);
    this.canvas.removeEventListener("wheel", this.onWheel);

    this.canvas.removeEventListener("touchstart", this.onMouseDown);
    document.removeEventListener("touchmove", this.onMouseMove);
    this.canvas.removeEventListener("touchend", this.onMouseUp);
  };

  getMouseOnCircle(v: vec2) {
    const { left, top, width, height } = this.box;
    return vec2.fromValues(
      (v[0] - width * 0.5 - left) / (width * 0.5),
      (height + 2 * (top - v[1])) / width // screen.width intentional
    );
  }

  onMouseDown = (event: MouseEvent | TouchEvent) => {
    this.isMouseDown = true;
    this.canvas.style.cursor = "grabbing";

    this.prevMousePos = this.getMouseOnCircle(getCursorPos(event));
    vec2.copy(this.mousePos, this.prevMousePos);
  };

  onMouseUp = () => {
    this.isMouseDown = false;
    this.canvas.style.cursor = "grab";
  };

  onMouseMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isMouseDown) {
      return;
    }

    vec2.copy(this.prevMousePos, this.mousePos);
    this.mousePos = this.getMouseOnCircle(getCursorPos(event));
  };

  onWheel = (e: MouseWheelEvent) => {
    this.zoomStart -= e.deltaY * 0.025;
  };

  update = () => {
    const eye = vec3.create();
    vec3.subtract(eye, this.position, this.target);

    {
      // zoom
      const factor = 1.0 + (this.zoomEnd - this.zoomStart) * 0.01;
      vec3.scale(eye, eye, factor);
      this.zoomStart += (this.zoomEnd - this.zoomStart) * this.easing;
    }

    {
      // rotate
      const move = vec3.fromValues(
        this.mousePos[0] - this.prevMousePos[0],
        this.mousePos[1] - this.prevMousePos[1],
        0
      );
      const angle = vec3.length(move);
      if (angle) {
        const dir = vec3.create();
        vec3.copy(dir, eye);
        vec3.normalize(dir, dir);
        const up = vec3.create();
        vec3.copy(up, this.up);
        vec3.normalize(up, up);

        const sideway = vec3.create();
        vec3.cross(sideway, up, dir);
        vec3.normalize(sideway, sideway);

        vec3.scale(sideway, sideway, move[0]);
        vec3.scale(up, up, move[1]);
        vec3.add(move, up, sideway);

        const axis = vec3.create();
        vec3.cross(axis, move, eye);
        vec3.normalize(axis, axis);

        const q = quat.create();
        quat.setAxisAngle(q, axis, angle);
        vec3.transformQuat(eye, eye, q);
        vec3.transformQuat(this.up, this.up, q);

        vec3.copy(this.lastAxis, axis);
        this.lastAngle = angle;
      } else if (this.lastAngle > 0.01) {
        this.lastAngle *= Math.sqrt(1.0 - this.easing);
        const q = quat.create();
        quat.setAxisAngle(q, this.lastAxis, this.lastAngle);
        vec3.transformQuat(eye, eye, q);
        vec3.transformQuat(this.up, this.up, q);
      }
      vec2.copy(this.prevMousePos, this.mousePos);
    }

    vec3.add(this.position, this.target, eye);
    this.lookAt(this.position, this.target, this.up);
  };
}

export default TrackballCamera;
