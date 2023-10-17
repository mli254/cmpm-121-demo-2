import "./style.css";

const app: HTMLDivElement = document.querySelector("#app")!;

const gameName = "Sticky Sketch";
document.title = gameName;

const header = document.createElement("h1");
header.innerHTML = gameName;
app.append(header);

const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.append(canvas);

const ctx = canvas.getContext("2d")!;

const cursor = { active: false, x: 0, y: 0 };

//const paths = [];

canvas.addEventListener("mousedown", (event) => {
  cursor.active = true;
  cursor.x = event.offsetX;
  cursor.y = event.offsetY;
});

canvas.addEventListener("mousemove", (event) => {
  if (cursor.active) {
    ctx.beginPath();
    ctx.moveTo(cursor.x, cursor.y);
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    cursor.x = event.offsetX;
    cursor.y = event.offsetY;
  }
});

canvas.addEventListener("mouseup", () => {
  cursor.active = false;
});

const clearButton = document.createElement("button");
clearButton.innerHTML = "clear";
app.append(clearButton);

const canvasStartX = 0;
const canvasStartY = 0;
clearButton.addEventListener("click", () => {
  ctx.clearRect(canvasStartX, canvasStartY, canvas.width, canvas.height);
});
