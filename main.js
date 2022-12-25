const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 50;

const playAgainButton = document.getElementById('play-again');
const ballCounter = document.getElementById("ball-counter");
const freezeCheckbox = document.getElementById("freeze");

const ballAdditionElement = document.getElementById("ball-addition");
const ballExplosionElement = document.getElementById("ball-explosion");

const tpsSlider = document.getElementById("tps-slider");
const fpsSlider = document.getElementById("fps-slider");

const updatesElement = document.getElementById("updates");
const framesElement = document.getElementById("frames");

const friction = .99; // Трение
const gravity = .981; // Гравитация

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

const sources = [
	{
		name: "arab",
		src: "content/sounds/arab.mp3",
		baseVolume: 0.5,
		volumeStep: 0
	},
	{
		name: "bounce",
		src: "content/sounds/bounce.mp3",
		baseVolume: 0.5,
		volumeStep: 0.01
	},
	{
		name: "explosion",
		src: "content/sounds/bounce.mp3",
		baseVolume: 0.5,
		volumeStep: 0.01
	}
];

// Задаём значения по умолчанию и placeholder'ы для ввода цифр
for (const element of document.getElementsByClassName("numberic-input")) {
	element.placeholder = `${element.min}-${element.max}`;
}

tpsSlider.max = tpsSliderValues.length - 1;
fpsSlider.max = fpsSliderValues.length - 1;

let tps = tpsSliderValues.at(-1); // Обновления физики в секунду
let fps = fpsSliderValues.at(-1); // Обновление области отрисовки в секунду

let soundMuted = false;
let globalSoundsCounter = 0;
let soundLimiter = 32;

//
// Спрайты
//
const ballSprite = new Image();
ballSprite.src = 'content/sprites/ball.png';

const explosionSprites = new Image();
explosionSprites.src = 'content/sprites/explosion.png';

let ballsAddedPerTick = ballAdditionElement.getElementsByClassName("ball-amount")[0].value;
let ballsExplodedPerTick = ballExplosionElement.getElementsByClassName("ball-amount")[0].value;

let calculatedFPS = 0;
let calculatedTPS = 0;

// Классы
class Ball {
	constructor(x, y, diameter = 16) {
		const random = performance.now();
		const angle = random % Math.PI * 2;
		const acceleration = random % 16 + 16;

		this.x = Math.max(diameter, Math.min(canvas.width - diameter, x));
		this.y = Math.max(diameter, Math.min(canvas.height - diameter, y));
		this.diameter = diameter;
		this.dx = Math.cos(angle) * acceleration;
		this.dy = Math.sin(angle) * acceleration;
	}
	update() {
		let isCollided = false;

		// Bounce off the edges
		if (this.x + this.dx < this.diameter / 2 || this.x + this.dx + this.diameter / 2 >= canvas.width) {
			this.dx = -this.dx * 0.35;
			isCollided = true;
		}

		if (this.y + this.dy < this.diameter / 2 || this.y + this.dy + this.diameter / 2 >= canvas.height) {
			this.dy = -this.dy * 0.45;
			isCollided = true;
		}
		else {
			this.dy += gravity;
		}

		if (isCollided) {
			this.dx *= friction;
			this.dy *= friction;
		}

		if (isCollided && Math.abs(this.dy) > 3) {
			audioPlayer.play(audioPlayer.identifiers.bounce);
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

// Меня убьют за говнокод
class AudioPlayer {
	readyState = 0;
	/*
	 * 0 - initializing
	 * 1 - ready
	 */
	#queue = [];
	#sources = [];
	#audio = [];
	#looped = new Set();
	#paused = false;
	#identifiers = null;
	#muted = false;

	constructor(sources = []) {
		for (const source of sources)
			this.addSource(source);
		this.readyState = 1;
	}

	addSource(source) {
		if (source === undefined) return;

		const audio = this.#audio[this.#audio.push(new Audio(source.src)) - 1];

		audio.oncanplaythrough = () => {
			this.#sources.push({ name: source.name, src: audio.src, duration: audio.duration, baseVolume: source.baseVolume, volumeStep: source.volumeStep });
		}
		this.#identifiers = null;
	}

	get identifiers() {
		if (this.#identifiers) return this.#identifiers;

		const identifiers = {};

		for (let i = 0; i < this.#sources.length; i++) {
			const source = this.#sources[i];
			identifiers[source.name] = i;
		}

		this.#identifiers = identifiers;

		return identifiers;
	}

	get muted() {
		return this.#muted;
	}

	set muted(value) {
		this.#muted = !!value;
		if (this.#muted) {
			for (const audio of this.#audio) {
				audio.pause();
			}
		} else {
			if (!this.#paused)
				for (const index of this.#looped) {
					this.#audio[index].play();
				}
		}
	}

	update() {
		const now = performance.now();
		this.#queue = this.#queue.filter(s => (now - s.startAt) / 1000 < this.#sources[s.id].duration);

		if (this.readyState === 0 || this.#muted) return;

		const queue = this.#queue;
		const volumeArray = this.#sources.map(s => s.baseVolume);

		for (let i = 0; i < queue.length; i++) {
			const audio = this.#audio[queue[i].id];
			const source = this.#sources[queue[i].id];

			if (source.src !== audio.src)
				audio.src = source.src;

			if (volumeArray[queue[i].id] < 1) volumeArray[queue[i].id] += source.volumeStep;

			if (audio.paused)
				audio.play();
		}
		for (let i = 0; i < volumeArray.length; i++) {
			if (this.#audio[i]) this.#audio[i].volume = Math.max(0, Math.min(volumeArray[i], 1));
		}
	}

	play(identifier) {
		this.#queue.push({ id: identifier, startAt: performance.now() });
	}

	playLoop(identifier, volume = .25) {
		const audio = this.#audio[identifier];
		audio.loop = true;
		this.#looped.add(identifier);
		if (!this.#paused && !this.#muted) audio.play();
		audio.volume = volume;
	}

	endLoop(identifier, resetProgress = true) {
		const audio = this.#audio[identifier];
		audio.loop = false;
		this.#looped.delete(identifier);
		if (resetProgress) audio.load();
		else audio.pause();
	}

	pause() {
		for (const audio of this.#audio) {
			audio.pause();
		}
		this.#paused = true;
	}

	resume() {
		if (!this.#muted) {
			for (const index of this.#looped) {
				this.#audio[index].play();
			}
		}
		this.#paused = false;
	}
}

const ticks = new Ticks();
const animFrames = new AnimFrames();
const audioPlayer = new AudioPlayer();

for (const source of sources) {
	audioPlayer.addSource(source);
}

let ballStorage = new ObjectStorage();
let explosionStorage = new ObjectStorage();

// Event listeners

canvas.addEventListener('mousedown', (mouseEvent) => {
	addBall(getRelativeCursorPosition(canvas, mouseEvent));
	ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
}, false);

playAgainButton.addEventListener('click', () => {
	ballStorage = new ObjectStorage();
	explosionStorage = new ObjectStorage();
	ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
}, false);

addEventListener("resize", resizeCanvas);

// Switchers

function toggleBallExplosion(isEnabled) {
	if (isEnabled) {
		ticks.subscribe(explodeBalls, parseInt(ballExplosionElement.getElementsByClassName("tick-interval")[0].value));
		audioPlayer.playLoop(audioPlayer.identifiers.arab);
	}
	else {
		ticks.unsubscribe(explodeBalls);
		audioPlayer.endLoop(audioPlayer.identifiers.arab);
	}
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

// freeze/unfreeze

function freezeGame() {
	animFrames.subscribe(drawFrozenMask, 1);
	audioPlayer.pause();
	changeTPS(0);
}

function unfreezeGame() {
	tps = tpsSliderValues[tpsSlider.value];
	audioPlayer.resume();
	changeTPS(tps);
	animFrames.unsubscribe(drawFrozenMask);
}

// Slider handlers

function onTPSSliderChange(index) {
	if (tps == 0) {
		freezeCheckbox.checked = false;
		unfreezeGame();
	} else {
		changeTPS(tpsSliderValues[index]);
	}
}

function onFPSSliderChange(index) {
	changeFPS(fpsSliderValues[index]);
}

// numberic input handlers

function changeBallAdditionInterval(interval) {
	if (ticks.has(autoBallAddition)) ticks.subscribe(autoBallAddition, interval);
}
function changeBallExplosionInterval(interval) {
	if (ticks.has(explodeBalls)) ticks.subscribe(explodeBalls, interval);
}

// regular logic events

function updateBalls() {
	for (const ball of ballStorage.values()) {
		ball.update();
	}
}

function autoBallAddition() {
	let ballAmount = ballsAddedPerTick;
	while (ballAmount-- > 0) {
		const random = performance.now();
		addBall({ x: random % canvas.width, y: random % canvas.height });
	}
}

function explodeBalls() {
	if (ballStorage.size > 0) {
		for (const ball of ballStorage.removeFirst(ballsExplodedPerTick)) {
			explosionStorage.add({ stage: 12, x: ball.x, y: ball.y });
			audioPlayer.play(audioPlayer.identifiers.explosion, .45);
		}
	}
	if (explosionStorage.size > 0) animFrames.subscribe(drawExplosions, 1, 1);
}

// animation frame functions

function showFPS() {
	const uiElement = document.getElementById("fps-counter");
	uiElement.innerHTML = `TPS (target): ${calculatedTPS.toFixed(2)} (${(tps).toFixed(1)})\t` + `FPS (target): ${calculatedFPS.toFixed(2)} (${(fps).toFixed(1)})`;

}

function drawBalls() {
	const positions = [];
	for (const ball of ballStorage.values()) {
		if (positions.findIndex(c => Math.abs(c.x - ball.x) < 1.5 && Math.abs(c.y - ball.y) < 1.5) === -1) {
			ctx.drawImage(ballSprite, ball.x - ball.diameter / 2, ball.y - ball.diameter / 2, ball.diameter, ball.diameter);
			positions.push({ x: ball.x, y: ball.y });
		}
	}
}

function drawTrails() {
	const positions = [];
	for (const ball of ballStorage.values()) {
		if (positions.findIndex(c => Math.abs(c.x - ball.x) < 1.5 && Math.abs(c.y - ball.y) < 1.5) == -1) {
			if ((ball.dx ** 2 + ball.dy ** 2) ** 0.5 > ball.diameter / 2) {
				drawTrail(
					{ x: ball.x, y: ball.y },
					{ x: ball.x - ball.dx, y: ball.y - ball.dy },
					ball.diameter,
					"rgba(127,127,127,255)", "rgba(0,0,0,0)"
				);
			}

			positions.push({ x: ball.x, y: ball.y });
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
		if (!freeze.checked) e.stage--;

		if (e.stage === 0) {
			explosionStorage.delete(i);
		} {
			const frameStart = (11 - e.stage) * explosionSprites.width / 12;
			ctx.drawImage(explosionSprites, frameStart, 0, 96, 96, e.x - 48, e.y - 48, 96, 96);
		}
	}
	if (explosionStorage.size === 0) animFrames.unsubscribe(drawExplosions);
}

function drawFrozenMask() {
	ctx.fillStyle = "rgba(54, 154, 255, .2)";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Util

function getRelativeCursorPosition(canvas, event) {
	const rect = canvas.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;

	return { x, y };
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

function addBall(position) {
	ballStorage.add(new Ball(position.x, position.y));
}

function compareFunction(a, b) {
	return a - b;
}

// Автоматически подгоняет область отрисовки под размер окна
function resizeCanvas() {
	canvas.width = window.innerWidth - 20;
	canvas.height = window.innerHeight - 50;

	for (const ball of ballStorage.values()) {
		if (ball.x > canvas.width - ball.diameter)
			ball.x = ball.diameter;
		if (ball.y > canvas.height - ball.diameter)
			ball.y = ball.diameter;
	}
}

let tickInterval = setInterval(() => ticks.tick(performance.now()), 1000 / tps);
window.requestAnimationFrame((timestamp) => animFrames.animFrame(timestamp));

// Adding listeners

ticks
	.subscribe(updateBalls, 1)
	.subscribe(() => audioPlayer.update(), 5);

animFrames
	.subscribe(drawTrails, 1, 0)
	.subscribe(drawBalls, 1, 1)
	.subscribe(showFPS, 10, 3);