import Camera from "./Camera";

class TrackballController {
  isMouseDown: boolean;
  lastMouseX: number;
  lastMouseY: number;
  sensitivity: number;

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.sensitivity = 0.02;
  }

  tick = () => {};

  handleMouseDown = (e: Event) => {};

  handleMouseUp = (e: MouseEvent) => {};

  handleMouseMove = (e: MouseEvent) => {
    console.log(this.isMouseDown);
  };

  handleMouseWeel = (e: MouseEvent) => {};

  addEventListener(canvas: HTMLCanvasElement) {
    window.addEventListener("mouseup", this.handleMouseUp);
    canvas.addEventListener("moudedown", this.handleMouseDown);
    canvas.addEventListener("mousemove", this.handleMouseMove);
    canvas.addEventListener("wheel", this.handleMouseWeel);
  }

  removeEventListener(canvas: HTMLCanvasElement) {
    window.removeEventListener("mouseup", this.handleMouseUp);
    canvas.removeEventListener("moudedown", this.handleMouseDown);
    canvas.removeEventListener("mousemove", this.handleMouseMove);
    canvas.removeEventListener("wheel", this.handleMouseWeel);
  }
}

export default TrackballController;
