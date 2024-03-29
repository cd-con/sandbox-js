const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth - 20;
canvas.height = window.innerHeight - 50;

const playAgainButton = document.getElementById('play-again');
const ballCounter = document.getElementById("ball-counter");

const ballAdditionElement = document.getElementById("ball-addition");
const ballExplosionElement = document.getElementById("ball-explosion");

const tpsSlider = document.getElementById("tps-slider");
const fpsSlider = document.getElementById("fps-slider");

const updatesElement = document.getElementById("updates");
const framesElement = document.getElementById("frames");

const friction = .99; // Трение
const gravity = .981; // Гравитация

let lerpAmount = 1.0;
let debug = false;

const fpsSliderValues = [
	1,
	15,
	24,
	30,
	60,
	75,
	120,
	144,
	240
].sort(compareFunction);
const tpsSliderValues = [
	1,
	5,
	16,
	24,
	64,
	128
].sort(compareFunction);

// Задаём значения по умолчанию и placeholder'ы для ввода цифр
for (const element of document.getElementsByClassName("numberic-input")) {
	element.placeholder = `${element.min}-${element.max}`;
}

tpsSlider.max = tpsSliderValues.length - 1;
fpsSlider.max = fpsSliderValues.length - 1;

let tps = tpsSliderValues.at(4); // Обновления физики в секунду
let fps = fpsSliderValues.at(4); // Обновление области отрисовки в секунду

//
// Звук
//

let soundMuted = false;
let globalSoundsCounter = 0;
let soundLimiter = 32;

const ballBounceSound = new SoundEntity("content/sounds/bounce.mp3");
const ballExplosionSound = new SoundEntity("content/sounds/explosion.mp3");
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

// Классы теперь вынесены в classes.js

const ticks = new Ticks();
const animator = new AnimFrames();

let ballStorage = new ObjectStorage();
let explosionStorage = new ObjectStorage();

// Event listeners

canvas.addEventListener('mousedown', (mouseEvent) => {
	addBall(getRelativeCursorPosition(mouseEvent));
	ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
}, false);

playAgainButton.addEventListener('click', () => {
	ballStorage = new ObjectStorage();
	explosionStorage = new ObjectStorage();
	ballCounter.innerHTML = `Balls count: ${ballStorage.size}`;
}, false);

addEventListener("resize", () => {resizeCanvas()});

function toggleBallExplosion(isEnabled) {
	if (isEnabled)
		ticks.subscribe(explodeBalls, parseInt(ballExplosionElement.getElementsByClassName("tick-interval")[0].value));
	else
		ticks.unsubscribe(explodeBalls);
}

function toggleDrawTrail(isEnabled) {
	if (isEnabled)
		animator.subscribe(drawTrails, 1, 0);
	else
		animator.unsubscribe(drawTrails);
}

function toggleAutoBallAddition(isEnabled) {
	if (isEnabled)
		ticks.subscribe(autoBallAddition, parseInt(ballAdditionElement.getElementsByClassName("tick-interval")[0].value));
	else
		ticks.unsubscribe(autoBallAddition);
}
function onTPSSliderChange(index) {
	if(tps == 0){
		document.getElementById("freeze").checked = false;
		unfreezeGame();
	}else{
		changeTPS(tpsSliderValues[index]);
	}
}
function onFPSSliderChange(index) {
	changeFPS(fpsSliderValues[index]);
}
function changeTPS(_tps) {
	tps = _tps
	clearInterval(tickInterval);
	lerpAmount = scaleValueRaw(tps, [0, 128], [0, 1.05]);
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

function updateBalls() {
	for (const ball of ballStorage.values()) {
		ball.fixedUpdate();
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
			explosionStorage.add({ stage: 12, x: ball.x, y: ball.y});
		}
	}
	if (explosionStorage.size > 0) animator.subscribe(drawExplosions, 1, 1);
}
function addBall(position) {
	ballStorage.add(new Ball(position.x, position.y));
}

// Interval functions

function showFPS() {
	const uiElement = document.getElementById("fps-counter");
	uiElement.innerHTML = `FPS (target): ${calculatedFPS.toFixed(2)} (${(fps).toFixed(1)})`

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
	for (const ball of ballStorage.values()) {
		ball.update();
		if (positions.findIndex(c => Math.abs(c.x - ball.x) < 1.5 && Math.abs(c.y - ball.y) < 1.5) == -1) {
			if (debug){
				ctx.beginPath();
				ctx.arc(ball.x, ball.y, ball.diameter / 2, 0, 2 * Math.PI, false);
				ctx.lineWidth = 1;
				ctx.strokeStyle = '#ffffff';
				ctx.stroke();
			}else{
				ctx.drawImage(ballSprite, ball.x - ball.diameter / 2, ball.y - ball.diameter / 2, ball.diameter, ball.diameter);
			}

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
		e.stage--;
		if (e.stage == 11 && !soundMuted){
			ballExplosionSound.play();
		}
		if (e.stage == 0) {
			explosionStorage.delete(i);
		} {
			const frameStart = (11 - e.stage) * explosionSprites.width / 12;
			ctx.drawImage(explosionSprites, frameStart, 0, 96, 96, e.x - 48, e.y - 48, 96, 96);
		}
	}
	if (explosionStorage.size === 0) animator.unsubscribe(drawExplosions);
}

// Вспомогательные функции
function getRelativeCursorPosition(event) {
	const clientBounding = canvas.getBoundingClientRect();
	const x = scaleValue(event.clientX - clientBounding.x, [0, canvas.width], [8, canvas.width - 8]);
	const y = scaleValue(event.clientY - clientBounding.y, [0, canvas.height], [8, canvas.height - 8]);
	return { x, y };
}

function scaleValue(value, from, to) {
	return ~~(scaleValueRaw(value, from, to));
}

function scaleValueRaw(value, from, to) {
	var scale = (to[1] - to[0]) / (from[1] - from[0]);
	var capped = Math.min(from[1], Math.max(from[0], value)) - from[0];
	return capped * scale + to[0];
}

function freezeGame() {
	animator.unsubscribe(drawExplosions);
	changeTPS(0);
}

function unfreezeGame() {
	tps = tpsSliderValues[tpsSlider.value];
	changeTPS(tps);
	if (explosionStorage.size > 0)
		animator.subscribe(drawExplosions, 1, 2);
}

function compareFunction(a, b) {
	return a - b;
}

// Автоматически подгоняет область отрисовки под размер окна
// Также автоматически перетягивает мячи на пройденное расстояние
let resizeEndTimeout;
let canvasInitSize;
function resizeCanvas(){ 
	if (resizeEndTimeout == null){ 
		console.log('Resize event start');
		canvasInitSize = {x: canvas.width, y: canvas.height};
		document.getElementById("freeze").checked = true; 
		freezeGame(); // Замораживаем игру на время перетягивания
	}
	
	clearTimeout(resizeEndTimeout);
  	resizeEndTimeout = setTimeout(resizeEnd, 250);

	canvas.width = window.innerWidth - 20;
	canvas.height = window.innerHeight - 50;
}

function resizeEnd(){
	
	console.log('Resize event end');
	resizeEndTimeout = null;
	for (const ball of ballStorage.values()) {
		ball.x = scaleValue(ball.x, [8, canvasInitSize.x - 8], [8,canvas.width - 8])
		ball.y = scaleValue(ball.y, [8, canvasInitSize.y - 8], [8,canvas.height - 8])
	}

	document.getElementById("freeze").checked = false;
	unfreezeGame();	
}

ticks
	.subscribe(updateBalls, 1);
animator
	.subscribe(drawTrails, 1, 0)
	.subscribe(drawBalls, 1, 1)
	.subscribe(showFPS, 10, 3);
	
let tickInterval = setInterval(() => ticks.tick(performance.now()), 1000 / tps);
window.requestAnimationFrame((timestamp) => animator.animFrame(timestamp));
