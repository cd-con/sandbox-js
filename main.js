const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;

const cumballEntity = new Image();
cumballEntity.src = 'content/cumball.png';

const initialVelocity = {
	x: 32,
	y: 32
};
const friction = 0.8;
const gravity = 4.88;
const intervalBetweenFrames = 50; // In milliseconds

class Ball {
	dx = initialVelocity.x;
	dy = initialVelocity.y;
	constructor(x, y, width = 16, height = 16) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}
	update() {
		// Bounce off the edges
		if (this.x + this.dx - this.width / 2 <= 0 || this.x + this.dx + this.width / 2 >= canvas.width)
			this.dx = -this.dx * friction;

		if (this.y + this.dy - this.height / 2 <= 0 || this.y + this.dy + this.height / 2 >= canvas.height)
			this.dy = -this.dy * friction;
		else
			// Our only acceleration is gravity | Действительно, наше ускорение - только гравитация
			this.dy += gravity; //Шары падают и прыгают, но сколько это будет продолжаться...

		this.x = Math.min(Math.max(this.x + this.dx, this.width / 2), canvas.width - this.width / 2); //Побег не удастся
		this.y = Math.min(Math.max(this.y + this.dy, this.height / 2), canvas.height - this.height / 2); //Вообще не удастся
	};
};

let cumballInstances = [];

canvas.addEventListener('mousedown', addXtraCumBall, false);

document.getElementById('play-again').addEventListener('click', () => {
	cumballInstances = [];
}, false);

function getRelativeCursorPosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	console.log("x: " + x + " y: " + y);

	return { x, y };
}
function addXtraCumBall(mouseEvent) {
	const { x, y } = getRelativeCursorPosition(canvas, mouseEvent);
	cumballInstances.push(new Ball(x, y));
}

function drawFrame() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (const cumball of cumballInstances) {
		ctx.drawImage(cumballEntity, cumball.x - cumball.width / 2, cumball.y - cumball.height / 2, cumball.width, cumball.height);
	}
}
function updateCumballs() {
	for (const cumball of cumballInstances) {
		cumball.update();
	}
}

setInterval(drawFrame, intervalBetweenFrames);
setInterval(updateCumballs, intervalBetweenFrames);