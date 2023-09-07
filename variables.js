function compareFunction(a, b) {
	return a - b;
}

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
// Хранилище всех коллайдеров
let colliderGlobalStorage = new ObjectStorage();

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
