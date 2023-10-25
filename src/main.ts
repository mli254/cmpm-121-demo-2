import "./style.css";

// setting up app elements
const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticky Sketch";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const exportButton = document.createElement("button");
exportButton.innerHTML = "export";
app.append(exportButton);

app.append(document.createElement("br"));

// creating canvas
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
canvas.style.cursor = "none";
app.append(canvas);

// creating classes
class Tool {
  context: CanvasRenderingContext2D;
  button: HTMLButtonElement;
  constructor(context: CanvasRenderingContext2D) {
    this.context = context;
    this.button = document.createElement("button");
  }
}

class Marker extends Tool {
  lineWidth: number;
  constructor(context: CanvasRenderingContext2D, lineWidth: number) {
    super(context);
    this.lineWidth = lineWidth;
    this.context.strokeStyle = "black";
  }
}

class Sticker extends Tool {
  size: number;
  name: string;
  constructor(context: CanvasRenderingContext2D, size: number, name: string) {
    super(context);
    this.size = size;
    this.name = name;
  }
}

class LineCommand {
  points: { x: number; y: number }[];
  marker: Marker;
  constructor(x: number, y: number, marker: Marker) {
    this.points = [{ x, y }];
    this.marker = marker;
  }
  display(context: CanvasRenderingContext2D) {
    context.lineWidth = this.marker.lineWidth;
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

class LinePreviewCommand {
  x: number;
  y: number;
  marker: Marker;
  constructor(x: number, y: number, marker: Marker) {
    this.x = x;
    this.y = y;
    this.marker = marker;
  }
  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 4;
    const yOffset = 2;
    context.font = `${this.marker.lineWidth * magnitude}px monospace`;
    context.fillText(
      "*",
      this.x - (this.marker.lineWidth * magnitude) / xOffset,
      this.y + (this.marker.lineWidth * magnitude) / yOffset
    );
  }
}

class StickerCommand {
  points: { x: number; y: number }[];
  sticker: Sticker;
  constructor(x: number, y: number, sticker: Sticker) {
    this.points = [{ x, y }];
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    const offset = 1;
    const magnitude = 8;
    const { x, y } = this.points[this.points.length - offset];
    context.font = `${this.sticker.size * magnitude}px monospace`;
    context.fillText(this.sticker.name, x, y);
  }
  drag(x: number, y: number) {
    this.points.push({ x, y });
  }
}

class StickerPreviewCommand {
  x: number;
  y: number;
  sticker: Sticker;
  constructor(x: number, y: number, sticker: Sticker) {
    this.x = x;
    this.y = y;
    this.sticker = sticker;
  }
  display(context: CanvasRenderingContext2D) {
    const magnitude = 8;
    const xOffset = 4;
    const yOffset = 2;
    context.font = `${this.sticker.size * magnitude}px monospace`;
    context.fillText(
      this.sticker.name,
      this.x - magnitude / xOffset,
      this.y + magnitude / yOffset
    );
  }
}

// variables
const start = 0;
const stickerSize = 4;
const thin = 2;
const thick = 4;

// getting canvas context
const ctx = canvas.getContext("2d")!;
const thinMarker = new Marker(ctx, thin);
const thickMarker = new Marker(ctx, thick);
let currentMarker: Marker | null = thinMarker; // by default, thin marker is selected
let currentSticker: Sticker | null = null; // only one tool active at a time
currentMarker?.button.classList.add("selectedTool"); // show that the thin marker is selected

// display list
const commands: (LineCommand | StickerCommand)[] = [];
const redoCommands: (LineCommand | StickerCommand)[] = [];

const stickerButtons: Sticker[] = [
  new Sticker(ctx, stickerSize, "🐋"),
  new Sticker(ctx, stickerSize, "🦀"),
  new Sticker(ctx, stickerSize, "🪼"),
];

let cursorCommand: LinePreviewCommand | StickerPreviewCommand | null = null;

const bus = new EventTarget();

function notify(name: string) {
  bus.dispatchEvent(new Event(name));
}
function redraw() {
  ctx.clearRect(start, start, canvas.width, canvas.height);

  commands.forEach((cmd) => cmd.display(ctx));

  if (cursorCommand) {
    cursorCommand.display(ctx);
  }
}

function changeTool() {
  stickerButtons.forEach(function (sticker) {
    sticker.button?.classList.remove("selectedTool");
  });
  thickMarker.button?.classList.remove("selectedTool");
  thinMarker.button?.classList.remove("selectedTool");
  if (currentSticker) {
    currentSticker?.button.classList.add("selectedTool");
  }

  if (currentMarker) {
    currentMarker?.button.classList.add("selectedTool");
  }
}

function addStickerButton(sticker: Sticker) {
  sticker.button.innerHTML = sticker.name;
  app.append(sticker.button);

  sticker.button.addEventListener("click", () => {
    currentSticker = sticker;
    currentMarker = null;
    notify("tool-changed");
  });
}

bus.addEventListener("drawing-changed", redraw);
bus.addEventListener("tool-moved", redraw);
bus.addEventListener("tool-changed", changeTool);

let currentLineCommand: LineCommand | StickerCommand | null = null;

// mouse events
canvas.addEventListener("mouseout", () => {
  cursorCommand = null;
  notify("tool-moved");
});

canvas.addEventListener("mouseenter", (e) => {
  if (currentMarker) {
    cursorCommand = new LinePreviewCommand(e.offsetX, e.offsetY, currentMarker);
    notify("tool-moved");
  } else if (currentSticker) {
    cursorCommand = new StickerPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentSticker
    );
    notify("tool-moved");
  }
});

canvas.addEventListener("mousemove", (e) => {
  const leftButton = 1;
  if (currentMarker) {
    cursorCommand = new LinePreviewCommand(e.offsetX, e.offsetY, currentMarker);
  } else if (currentSticker) {
    cursorCommand = new StickerPreviewCommand(
      e.offsetX,
      e.offsetY,
      currentSticker
    );
  }
  notify("tool-moved");

  if (e.buttons == leftButton) {
    cursorCommand = null;
    if (currentMarker) {
      currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    } else if (currentSticker) {
      currentLineCommand!.points.push({ x: e.offsetX, y: e.offsetY });
    }
    notify("drawing-changed");
  }
});

canvas.addEventListener("mousedown", (e) => {
  cursorCommand = null;
  if (currentMarker) {
    currentLineCommand = new LineCommand(e.offsetX, e.offsetY, currentMarker);
    commands.push(currentLineCommand);
  }
  if (currentSticker) {
    currentLineCommand = new StickerCommand(
      e.offsetX,
      e.offsetY,
      currentSticker
    );
    commands.push(currentLineCommand);
  }
  redoCommands.splice(start, redoCommands.length);
  notify("drawing-changed");
});

canvas.addEventListener("mouseup", () => {
  currentLineCommand = null;
  notify("drawing-changed");
});

// creating clear, undo, and redo buttons
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

app.append(document.createElement("br"));
const newSticker = document.createElement("button");
newSticker.innerHTML = "new sticker";
app.append(newSticker);

newSticker.addEventListener("click", () => {
  const offset = 1;
  const addSticker = prompt("Please choose an emoji:", "🍄");
  stickerButtons.push(new Sticker(ctx, stickerSize, addSticker!));
  addStickerButton(stickerButtons[stickerButtons.length - offset]);
});

app.append(document.createElement("br"));

thickMarker.button.innerHTML = "thick";
app.append(thickMarker.button);

thickMarker.button.addEventListener("click", () => {
  currentMarker = thickMarker;
  currentSticker = null;
  notify("tool-changed");
});

thinMarker.button.innerHTML = "thin";
app.append(thinMarker.button);

thinMarker.button.addEventListener("click", () => {
  currentMarker = thinMarker;
  currentSticker = null;
  notify("tool-changed");
});

stickerButtons.forEach(function (sticker: Sticker) {
  addStickerButton(sticker);
});

// adding functionality to the exportButton; further down to be able to reference the cmds
exportButton.addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = 1024;
  exportCanvas.height = 1024;
  exportCanvas.style.cursor = "none";

  const scaleX = 4;
  const scaleY = 4;
  const exportCtx = exportCanvas.getContext("2d")!;
  exportCtx.scale(scaleX, scaleY);
  exportCtx.clearRect(start, start, exportCanvas.width, exportCanvas.height);
  exportCtx.fillStyle = "white";
  exportCtx.fillRect(start, start, exportCanvas.width, exportCanvas.height);
  commands.forEach((cmd) => cmd.display(exportCtx));

  const anchor = document.createElement("a");
  anchor.href = exportCanvas.toDataURL("image/png");
  anchor.download = "sketchpad.png";
  anchor.click();
});
