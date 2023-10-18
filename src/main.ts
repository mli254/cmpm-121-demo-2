import "./style.css";

// setting up app elements
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

// creating classes
class Marker {
  context: CanvasRenderingContext2D;
  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.context.strokeStyle = "black";
    this.context.lineWidth = 2;
  }
}

class LineCommand {
  points: { x: number; y: number }[];
  constructor(x: number, y: number) {
    this.points = [{ x, y }];
  }
  display(context: CanvasRenderingContext2D) {
    context.beginPath();
    const { x, y } = this.points[start];
    context.moveTo(x, y);
    for (const { x, y } of this.points) {
      context.lineTo(x, y);
    }
    context.stroke();
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

// variables
const start = 0;

// getting canvas context
const ctx = canvas.getContext("2d")!;
const marker = new Marker(ctx);

// display list
const commands: LineCommand[] = [];
const redoCommands: LineCommand[] = [];

// observes and dispatches events when notified
const bus = new EventTarget();

// dispatches events
function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}

// redraws the screen when drawing is changed
function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.display(marker.context));
}

bus.addEventListener("drawing-changed", redraw);

let currentLineCommand: LineCommand | null = null;

// mouse events
canvas.addEventListener("mousemove", (e) => {
  const leftButton = 1;
  if (e.buttons == leftButton) {
    currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  currentLineCommand = new LineCommand(e.offsetX, e.offsetY);
  commands.push(currentLineCommand);
  redoCommands.splice(start, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

// creating buttons
app.append(document.createElement("br"));

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

clearButton.addEventListener("click", () => {
  commands.splice(start, commands.length); // empty out all previously stored line commands
  notify("drawing-changed");
});

const undoButton = document.createElement("button");
undoButton.innerHTML = "undo";
app.append(undoButton);

undoButton.addEventListener("click", () => {
  if (commands.length) {
    redoCommands.push(commands.pop()!);
    notify("drawing-changed");
  }
});

const redoButton = document.createElement("button");
redoButton.innerHTML = "redo";
app.append(redoButton);

redoButton.addEventListener("click", () => {
  if (redoCommands.length) {
    commands.push(redoCommands.pop()!);
    notify("drawing-changed");
  }
});
