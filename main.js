const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 32;
canvas.height = window.innerHeight - 128;

const cumballEntity = new Image();
cumballEntity.src = 'content/cumball.png';

const friction = 0.9;
const gravity = 9.81;

let intervalBetweenFrames = 16; // In milliseconds
let intervalBetweenBallDeploy = 25;

// BALL
class Ball {
	constructor(x, y, width = 16, height = 16) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		const angle = Math.random() * Math.PI * 2;
		const acceleration = Math.random() * 16 + 16;
		[this.dx, this.dy] = [Math.cos(angle) * acceleration, Math.sin(angle) * acceleration];
		this.trail = new Trail();
	}
	update() {
		// Bounce off the edges
		if (this.x + this.dx - this.width / 2 <= 0 || this.x + this.dx + this.width / 2 >= canvas.width)
			this.dx = -this.dx * friction * 0.35;

		if (this.y + this.dy - this.height / 2 <= 0 || this.y + this.dy + this.height / 2 >= canvas.height)
			this.dy = -this.dy * friction * 0.45;
		else
			// Our only acceleration is gravity | Действительно, наше ускорение - только гравитация
			this.dy += Math.round(gravity * friction) / 10; //Шары падают и прыгают, но сколько это будет продолжаться...

		this.x = Math.min(Math.max(this.x + this.dx, this.width / 2), canvas.width - this.width / 2); //Побег не удастся
		this.y = Math.min(Math.max(this.y + this.dy, this.height / 2), canvas.height - this.height / 2); //Вообще не удастся

		this.trail.update(this.x, this.y);
	};
};


class Trail {
	trailParticles = [];

	constructor(length = 32, initSize = 16, rgbaArray = [255, 0, 0, 255]) {
		this.length = length;
		this.initSize = initSize;
		this.colour = `rgba(${rgba.join(", ")})`;
	}

	update(x, y) {
		this.trailParticles.push({ x, y });

		this.trailParticles.splice(this.trailParticles.length, Infinity);
	}

	draw(ctx) {
		ctx.fillStyle = "#000000";
		this.trailParticles.forEach((e, i) => {
			const size = this.initSize - (this.initSize / length * i);
			ctx.drawRect(e.x - size / 2, e.y - size / 2, size, size);
		})

	}
}

let cumballInstances = [];

// Event listeners

canvas.addEventListener('mousedown', addXtraCumBall, false);

document.getElementById('play-again').addEventListener('click', () => {
	cumballInstances = [];
}, false);

let deployEnabled = false;
document.getElementById('auto-deploy').addEventListener('click', () => {
	deployEnabled = !deployEnabled;
	document.getElementById('auto-deploy').innerHTML = `Deploy balls automatically ${deployEnabled ? "✅": "❎"}`;
}, false);

function onPhysicsRefreshRateChange(interval) {
	intervalBetweenFrames = interval;
	clearInterval(updateInterval);
	updateInterval = setInterval(updateCumballs, intervalBetweenFrames);
}
function onAutodeployRateChange(interval) {
	intervalBetweenBallDeploy = interval;
	clearInterval(autoDeployInterval);
	autoDeployInterval = setInterval(autoDeploy, intervalBetweenBallDeploy);
}

function addXtraCumBall(mouseEvent) {
	const { x, y } = getRelativeCursorPosition(canvas, mouseEvent);
	cumballInstances.push(new Ball(x, y));
	document.getElementById("ball-counter").innerHTML = "Balls count: " + cumballInstances.length;
}

// Interval functions

function drawFrame() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (const cumball of cumballInstances) {
		ctx.drawImage(cumballEntity, cumball.x - cumball.width / 2, cumball.y - cumball.height / 2, cumball.width, cumball.height);
		cumball.trail.draw(ctx);
	}
}

function updateCumballs() {
	for (const cumball of cumballInstances) {
		cumball.update();
	}
}

function autoDeploy() {
	if (deployEnabled) {
		cumballInstances.push(new Ball(canvas.width / 2, canvas.height / 2));
	}
}

// Util

function getRelativeCursorPosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	console.log("x: " + x + " y: " + y);

	return { x, y };
}

setInterval(drawFrame, intervalBetweenFrames);
let updateInterval = setInterval(updateCumballs, intervalBetweenFrames);
let autoDeployInterval = setInterval(autoDeploy, intervalBetweenBallDeploy);