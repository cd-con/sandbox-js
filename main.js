const playAgainButton = document.getElementById('play-again');
const ballCounter = document.getElementById("ball-counter");

const ballAdditionElement = document.getElementById("ball-addition");
const ballExplosionElement = document.getElementById("explosion");

const tpsSlider = document.getElementById("tps-slider");
const fpsSlider = document.getElementById("fps-slider");

const updatesElement = document.getElementById("updates");
const framesElement = document.getElementById("frames");

const fpsSliderValues = [
	1,
	15,
	20,
	30,
	45,
	60
].sort(compareFunction);
const tpsSliderValues = [
	1,
	2,
	5,
	15,
	20,
	30,
	60
].sort(compareFunction);

tpsSlider.max = tpsSliderValues.length - 1;
fpsSlider.max = fpsSliderValues.length - 1;

let tps = tpsSliderValues.at(-1); //updates per second
let fps = fpsSliderValues.at(-1); //frames per second

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 37;
canvas.height = window.innerHeight - 128;

const cumballEntity = new Image();
cumballEntity.src = 'content/cumball.png';

const explosionSprites = new Image();
explosionSprites.src = 'content/explosion.png';

const friction = .99;
const gravity = .981;

for (const element of document.getElementsByClassName("numberic-input")) {
	element.value = 1;
	element.placeholder = `${element.min}-${element.max}`;
}

let ballAdditionAmount = ballAdditionElement.getElementsByClassName("ball-amount")[0].value;
let ballExplosionAmount = ballExplosionElement.getElementsByClassName("ball-amount")[0].value;

let calculatedFPS = 0;
let calculatedTPS = 0;

// classes
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
		let isEdgeCollision = false;
		// Bounce off the edges
		if (this.x + this.dx - this.diameter / 2 <= 0 || this.x + this.dx + this.diameter / 2 >= canvas.width) {
			this.dx = -this.dx * 0.35;
			isEdgeCollision = true;
		}

		if (this.y + this.dy - this.diameter / 2 <= 0 || this.y + this.dy + this.diameter / 2 >= canvas.height) {
			this.dy = -this.dy * 0.45;
			isEdgeCollision = true;
		}
		else {
			// Our only acceleration is gravity | Действительно, наше ускорение - только гравитация
			this.dy += gravity;
			isEdgeCollision = true;
		}

		if (isEdgeCollision) {
			this.dx *= friction;
			this.dy *= friction;
		}

		this.x += this.dx;
		this.y += this.dy;

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
	keys() {
		return this.#objects.keys();
	}
	values() {
		return this.#objects.values();
	}
	removeFirst = function* (amount) {
		while (amount-- > 0 && this.size > 0) {
			const key = this.#objects.keys().next().value;
			const object = this.#objects.get(key);

			this.#objects.delete(key);
			yield object;
		}
		return
	};
	get size() {
		return this.#objects.size;
	}
}

class Ticks {
	#i = 0;
	#listeners = new Map();
	#lastTick = performance.now();

	tick(timestamp) {
		const elapsed = timestamp - this.#lastTick;

		calculatedTPS = 1000 / elapsed;

		if (elapsed > 1000 / tps) {
			this.#update();
			this.#i++;
			this.#lastTick = timestamp;
		}
	}
	#update() {
		const ballsAmount = ballStorage.size;

		for (const [_function, interval] of this.#listeners.entries()) {
			if (this.#i % interval === 0) _function();
		}

		if (ballStorage.size !== ballsAmount)
			ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
	}
	subscribe(_function, interval) {
		this.#listeners.set(_function, interval);
		return this;
	}
	unsubscribe(_function) {
		this.#listeners.delete(_function);
		return this;
	}
	has(_function) {
		return this.#listeners.has(_function);
	}
};

class AnimFrames {
	#i = 0;
	#listeners = new Map();
	#lastTick = performance.now();

	animFrame(timestamp) {
		const elapsed = timestamp - this.#lastTick;

		calculatedFPS = 1000 / elapsed;

		if (elapsed > 1000 / fps) {
			this.#draw();
			this.#i++;
			this.#lastTick = timestamp;
		}

		window.requestAnimationFrame((timestamp) => this.animFrame(timestamp));
	}
	#draw() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		for (const [_function, { interval }] of this.#listeners.entries()) {
			if (this.#i % interval === 0) _function();
		}
	}
	subscribe(_function, interval, priority = Number.MAX_SAFE_INTEGER) {
		const newlistenersOrder = Array.from(this.#listeners.entries());
		newlistenersOrder.push([_function, { interval, priority }]);
		newlistenersOrder.sort(([, a], [, b]) => a.priority - b.priority);
		this.#listeners = new Map(newlistenersOrder);
		return this;
	}
	unsubscribe(_function) {
		this.#listeners.delete(_function);
		return this;
	}
	has(_function) {
		return this.#listeners.has(_function);
	}
	getPriority(_function) {
		return this.#listeners.get(_function).priority;
	}
};

const ticks = new Ticks();
const animFrames = new AnimFrames();

let ballStorage = new ObjectStorage();
let explosionStorage = new ObjectStorage();

// Event listeners

canvas.addEventListener('mousedown', (mouseEvent) => {
	addXtraCumBall(getRelativeCursorPosition(canvas, mouseEvent));
	ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
}, false);

playAgainButton.addEventListener('click', () => {
	ballStorage = new ObjectStorage();
	explosionStorage = new ObjectStorage();
	ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
}, false);

function toggleBallExplosion(isEnabled) {
	if (isEnabled)
		ticks.subscribe(explodeBalls, parseInt(ballExplosionElement.getElementsByClassName("tick-interval")[0].value));
	else
		ticks.unsubscribe(explodeBalls);
}

function toggleDrawTrail(isEnabled) {
	if (isEnabled)
		animFrames.subscribe(drawTrails, 1, 0);
	else
		animFrames.unsubscribe(drawTrails);
}

function toggleAutoBallAddition(isEnabled) {
	if (isEnabled)
		ticks.subscribe(autoBallAddition, parseInt(ballAdditionElement.getElementsByClassName("tick-interval")[0].value));
	else
		ticks.unsubscribe(autoBallAddition);
}
function onTPSSliderChange(index) {
	changeTPS(tpsSliderValues[index]);
}
function onFPSSliderChange(index) {
	changeFPS(fpsSliderValues[index]);
}
function changeTPS(_tps) {
	tps = _tps
	clearInterval(tickInterval);
	tickInterval = setInterval(() => ticks.tick(performance.now()), 1000 / tps);
	updatesElement.innerHTML = tps.toFixed(0);
}
function changeFPS(_fps) {
	fps = _fps
	framesElement.innerHTML = fps.toFixed(0);
}
function changeBallAdditionInterval(interval) {
	if (ticks.has(autoBallAddition)) ticks.subscribe(autoBallAddition, interval);
}
function changeBallExplosionInterval(interval) {
	if (ticks.has(explodeBalls)) ticks.subscribe(explodeBalls, interval);
}

function updateCumballs() {
	for (const cumball of ballStorage.values()) {
		cumball.update();
	}
}
function autoBallAddition() {
	let ballAmount = ballAdditionAmount;
	while (ballAmount-- > 0) {
		const random = performance.now();
		addXtraCumBall({ x: random % canvas.width, y: random % canvas.height });
	}
}
function explodeBalls() {
	if (ballStorage.size > 0) {
		for (const cumball of ballStorage.removeFirst(ballExplosionAmount)) {
			explosionStorage.add({ stage: 12, x: cumball.x, y: cumball.y, lastFrameTime: 0 });
		}
	}
	if (explosionStorage.size > 0) animFrames.subscribe(drawExplosions, 1, 1);
}
function addXtraCumBall(position) {
	ballStorage.add(new Ball(position.x, position.y));
}

// Interval functions

function showFPS() {
	const uiElement = document.getElementById("fps-counter");
	uiElement.innerHTML = `FPS(target): ${calculatedFPS.toFixed(2)} (${(fps).toFixed(1)})`

	if (calculatedFPS < Math.round(fps) - 12) {
		uiElement.style.color = "red";
	} else if (calculatedFPS > Math.round(fps) + 4) {
		uiElement.style.color = "green";
	} else {
		uiElement.style.color = "blue";
	}
}

function drawBalls() {
	const positions = [];
	for (const cumball of ballStorage.values()) {
		if (positions.findIndex(c => Math.abs(c.x - cumball.x) < 1.5 && Math.abs(c.y - cumball.y) < 1.5) == -1) {
			ctx.drawImage(cumballEntity, cumball.x - cumball.diameter / 2, cumball.y - cumball.diameter / 2, cumball.diameter, cumball.diameter);
			positions.push({ x: cumball.x, y: cumball.y });
		}
	}
}
function drawTrails() {
	const positions = [];
	for (const cumball of ballStorage.values()) {
		if (positions.findIndex(c => Math.abs(c.x - cumball.x) < 1.5 && Math.abs(c.y - cumball.y) < 1.5) == -1) {
			if ((cumball.dx ** 2 + cumball.dy ** 2) ** 0.5 > cumball.diameter / 2) {
				drawTrail(
					{ x: cumball.x, y: cumball.y },
					{ x: cumball.x - cumball.dx, y: cumball.y - cumball.dy },
					cumball.diameter,
					"rgba(127,127,127,255)", "rgba(0,0,0,0)"
				);
			}

			positions.push({ x: cumball.x, y: cumball.y });
		}
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
		} {
			const frameStart = (11 - e.stage) * explosionSprites.width / 12;
			ctx.drawImage(explosionSprites, frameStart, 0, 96, 96, e.x - 48, e.y - 48, 96, 96);
		}
	}

	if (explosionStorage.size === 0) animFrames.unsubscribe(drawExplosions);
}

// Util

function getRelativeCursorPosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	return { x, y };
}
function freezeGame() {
	animFrames.unsubscribe(drawExplosions);
	changeTPS(0);
}
function unfreezeGame() {
	tps = tpsSliderValues[tpsSlider.value];
	changeTPS(tps);
	if (explosionStorage.size > 0)
		animFrames.subscribe(drawExplosions, 1, 2);
}
function compareFunction(a, b) {
	return a - b;
}

ticks
	.subscribe(updateCumballs, 1);
animFrames
	.subscribe(drawTrails, 1, 0)
	.subscribe(drawBalls, 1, 1)
	.subscribe(showFPS, 10, 3);

let tickInterval = setInterval(() => ticks.tick(performance.now()), 1000 / tps);
window.requestAnimationFrame((timestamp) => animFrames.animFrame(timestamp));