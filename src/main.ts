import "./style.css";

// Setting up app elements
const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticky Sketch";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

// creating canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

// getting canvas context
const ctx = canvas.getContext("2d")!;

// arrays of points
const lines: { x: number; y: number }[][] = [];
const redoLines: { x: number; y: number }[][] = [];

let currentLine: { x: number; y: number }[] | null = null;

// new event
const drawingChanged = new Event("drawing-changed", {});

// drawing on the canvas using mouse input
const start = 0;
const offset = 1;

const cursor = { active: false, x: 0, y: 0 };

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;

  currentLine = [];
  lines.push(currentLine); // Question: why push an empty array?
  redoLines.splice(start, redoLines.length); // empties the redoLines array
  currentLine.push({ x: cursor.x, y: cursor.y }); // Question: why don't we push to the lines array again?

  // alert the observer
  canvas.dispatchEvent(drawingChanged);
});

canvas.addEventListener("mousemove", (event) => {
  if (cursor.active) {
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;

    // stores each new point, and dispatches the "drawing-changed" event
    currentLine!.push({ x: cursor.x, y: cursor.y });

    canvas.dispatchEvent(drawingChanged);
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;

  currentLine = null;
  canvas.dispatchEvent(drawingChanged);
});

// new Observer for the "drawing-changed" event that calls redraw when needed
canvas.addEventListener("drawing-changed", () => {
  redraw();
});

// redraws the entire canvas
function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);
  for (const line of lines) {
    if (line.length > offset) {
      ctx.beginPath();
      const { x, y } = line[start];
      ctx.moveTo(x, y);
      for (const { x, y } of line) {
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}
