const playAgainButton = document.getElementById('play-again');
const ballCounter = document.getElementById("ball-counter");
const canvas = document.getElementById("mainCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 32;
canvas.height = window.innerHeight - 128;

const cumballEntity = new Image();
cumballEntity.src = 'content/cumball.png';

const explosionSprites = new Image();
explosionSprites.src = 'content/explosion.png';

const friction = 0.9;
const gravity = 9.81;

let intervalBetweenFrames = 16; // In milliseconds
let intervalBetweenBallDeploy = 25;

let deployEnabled = false; // deploy controller
let trailEnabled = true;
let detonateBalls = false;

let start;
let FPS = 0;
// BALL
class Ball {
	constructor(x, y, diameter = 16) {
		const random = performance.now();

		this.x = x;
		this.y = y;
		this.diameter = diameter;
		const angle = random % Math.PI * 2;
		const acceleration = random % 16 + 16;
		this.dx = Math.cos(angle) * acceleration;
		this.dy = Math.sin(angle) * acceleration;
	}
	update() {
		// Bounce off the edges
		if (this.x + this.dx - this.diameter / 2 <= 0 || this.x + this.dx + this.diameter / 2 >= canvas.width)
			this.dx = -this.dx * friction * 0.35;

		if (this.y + this.dy - this.diameter / 2 <= 0 || this.y + this.dy + this.diameter / 2 >= canvas.height)
			this.dy = -this.dy * friction * 0.45;
		else {
			// Our only acceleration is gravity | Действительно, наше ускорение - только гравитация
			this.dy += Math.floor(gravity * friction) / 10;
		}

		this.x = Math.min(Math.max(this.x + this.dx, this.diameter / 2), canvas.width - this.diameter / 2); //Побег не удастся
		this.y = Math.min(Math.max(this.y + this.dy, this.diameter / 2), canvas.height - this.diameter / 2); //Вообще не удастся

	};
};

class ObjectStorage {
	#objects = new Map();
	#i = 0;
	constructor() {

	}
	add(explosion) {
		this.#objects.set(this.#i++, explosion);
	}
	delete(i) {
		return this.#objects.delete(i);
	}
	clear() {
		this.#objects.clear();
	}
	entries() {
		return this.#objects.entries();
	}
	keys (){
		return this.#objects.keys();
	}
	values(){
		return this.#objects.values();
	}
	removeFirst() {
		const key = this.#objects.keys().next().value;
		const object = this.#objects.get(key);

		this.#objects.delete(key);
		return object;
	};
	get size() {
		return this.#objects.size;
	}
}

let ballStorage = new ObjectStorage();
let explosionStorage = new ObjectStorage();

// Event listeners

canvas.addEventListener('mousedown', (mouseEvent) => {
	addXtraCumBall(getRelativeCursorPosition(canvas, mouseEvent));
}, false);

playAgainButton.addEventListener('click', () => {
	ballStorage = new ObjectStorage();
	explosionStorage = new ObjectStorage();
}, false);

document.getElementById('auto-deploy').addEventListener('click', () => {
	deployEnabled = !deployEnabled;
	document.getElementById('auto-deploy').innerHTML = `Deploy balls automatically ${deployEnabled ? "✔" : "❌"}`;
}, false);

document.getElementById('detonate-balls').addEventListener('click', () => {
	detonateBalls = true;
}, false);

document.getElementById('draw-trail').addEventListener('click', () => {
	trailEnabled = !trailEnabled;
	document.getElementById('draw-trail').innerHTML = `Draw trails ${trailEnabled ? "✔" : "❌"}`;
}, false);

function onPhysicsRefreshRateChange(interval) {
	intervalBetweenFrames = interval;
}
function onAutodeployRateChange(interval) {
	intervalBetweenBallDeploy = interval;
	clearInterval(autoDeployInterval);
	autoDeployInterval = setInterval(autoDeploy, intervalBetweenBallDeploy);
}
function mainFrame(timestamp) {
	if (!start) {
		start = timestamp;
	}

	const elapsed = timestamp - start;

	FPS = 1000 / elapsed;

	if (elapsed > intervalBetweenFrames) {
		start = timestamp;
		updateCumballs();
		drawFrame();
		showFPS();
		if (detonateBalls) {
			if (ballStorage.size > 0) {
				const cumball = ballStorage.removeFirst();
				explosionStorage.add({ framerate: 24, stage: 12, x: cumball.x, y: cumball.y, lastFrameTime: 0 });
				ballCounter.innerHTML = "Balls count: " + ballStorage.size;
			}
			else detonateBalls = false;
		}
	}

	window.requestAnimationFrame(mainFrame);
}

function addXtraCumBall(position) {
	ballStorage.add(new Ball(position.x, position.y));
	ballCounter.innerHTML = "Balls count: " + ballStorage.size;
}

// Interval functions

function drawFrame() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawExplosions();
	for (const cumball of ballStorage.values()) {
		if (trailEnabled && (cumball.dx ** 2 + cumball.dy ** 2) ** 0.5 > cumball.diameter / 2) {
			drawTrail(
				{ x: cumball.x, y: cumball.y },
				{ x: cumball.x - cumball.dx, y: cumball.y - cumball.dy },
				cumball.diameter,
				"rgba(127,127,127,255)", "rgba(0,0,0,0)"
			);
		}
		ctx.drawImage(cumballEntity, cumball.x - cumball.diameter / 2, cumball.y - cumball.diameter / 2, cumball.diameter, cumball.diameter);
	}

}

function showFPS() {
	if (this.i === undefined || this.i > 10) this.i = 0; // Отличный план, очень надёжный, честно
	this.i++;
	if (this.i < 10) return;

	const uiElement = document.getElementById("fps-counter");
	uiElement.innerHTML = `FPS(target): ${FPS.toFixed(2)} (${(1000 / intervalBetweenFrames).toFixed(1)})`

	if (FPS < Math.round(1000 / intervalBetweenFrames) - 12) {
		uiElement.style.color = "red";
	} else if (FPS > Math.round(1000 / intervalBetweenFrames) + 4) {
		uiElement.style.color = "green";
	} else {
		uiElement.style.color = "blue";
	}
}

function drawTrail(start, end, initialSize, startColor, endColor) {

	const angle = Math.atan2(end.y - start.y, end.x - start.x);
	const upperPointAngle = angle - Math.PI / 2;
	const lowerPointAngle = angle + Math.PI / 2;
	const radius = initialSize / 2;

	const linearGradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
	linearGradient.addColorStop(0, startColor);
	linearGradient.addColorStop(1, endColor);

	ctx.fillStyle = linearGradient;
	ctx.beginPath();
	ctx.moveTo(end.x, end.y);
	ctx.lineTo(start.x + Math.cos(upperPointAngle) * radius, start.y + Math.sin(upperPointAngle) * radius);
	ctx.lineTo(start.x + Math.cos(lowerPointAngle) * radius, start.y + Math.sin(lowerPointAngle) * radius);
	ctx.closePath();
	ctx.fill();

}

function drawExplosions() {
	for (const [i, e] of explosionStorage.entries()) {

		e.stage--;

		if (e.stage == 0) {
			explosionStorage.delete(i);
		}

		const frameStart = (11 - e.stage) * explosionSprites.width / 12;
		ctx.drawImage(explosionSprites, frameStart, 0, 96, 96, e.x - 48, e.y - 48, 96, 96);
	}
}
function updateCumballs() {
	for (const cumball of ballStorage.values()) {
		cumball.update();
	}
}

function autoDeploy() {
	if (deployEnabled) {
		const random = performance.now();
		addXtraCumBall({ x: random % canvas.width, y: random % canvas.height });
	}
}

// Util

function getRelativeCursorPosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	return { x, y };
}
let autoDeployInterval = setInterval(autoDeploy, intervalBetweenBallDeploy);

window.requestAnimationFrame(mainFrame);