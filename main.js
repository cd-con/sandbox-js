boom-boom
const playAgainButton = document.getElementById('play-again')
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
// BALL
class Ball {
	constructor(x, y, diameter = 16) {
		this.x = x;
		this.y = y;
		this.diameter = diameter;
		this.state = "alive";
		const angle = Math.random() * Math.PI * 2;
		const acceleration = Math.random() * 16 + 16;
		[this.dx, this.dy] = [Math.cos(angle) * acceleration, Math.sin(angle) * acceleration];
		this.animationStage = 0;
	}
	async update() {
		if (this.state == "alive"){
		// Bounce off the edges
		if (this.x + this.dx - this.diameter / 2 <= 0 || this.x + this.dx + this.diameter / 2 >= canvas.width)
			this.dx = -this.dx * friction * 0.35;

		if (this.y + this.dy - this.diameter / 2 <= 0 || this.y + this.dy + this.diameter / 2 >= canvas.height)
			this.dy = -this.dy * friction * 0.45;
		else
			// Our only acceleration is gravity | Действительно, наше ускорение - только гравитация
			this.dy += Math.round(gravity * friction) / 10; //Шары падают и прыгают, но сколько это будет продолжаться...

		this.x = Math.min(Math.max(this.x + this.dx, this.diameter / 2), canvas.width - this.diameter / 2); //Побег не удастся
		this.y = Math.min(Math.max(this.y + this.dy, this.diameter / 2), canvas.height - this.diameter / 2); //Вообще не удастся
		}
		else{
			explosionsArray.push({framerate:24,stage:1,maxStage:12,x:this.x,y:this.y,lastFrameTime:0});
			ballInstances.splice(ballInstances.indexOf(this),1);
		}
	};
};

let ballInstances = [];

// Event listeners

canvas.addEventListener('mousedown', (mouseEvent) => {
	addXtraCumBall(getRelativeCursorPosition(canvas, mouseEvent));
}, false);

playAgainButton.addEventListener('click', () => {
	ballInstances = [];
}, false);

document.getElementById('auto-deploy').addEventListener('click', () => {
	deployEnabled = !deployEnabled;
	document.getElementById('auto-deploy').innerHTML = `Deploy balls automatically ${deployEnabled ? "✔" : "❌"}`;
}, false);

document.getElementById('detonate-balls').addEventListener('click', () => {
	ballInstances.forEach((e) =>{e.state = "boom"})
}, false);

document.getElementById('draw-trail').addEventListener('click', () => {
	trailEnabled = !trailEnabled;
	document.getElementById('draw-trail').innerHTML = `Draw trails ${trailEnabled ? "✔" : "❌"}`;
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

function addXtraCumBall(position) {
	ballInstances.push(new Ball(position.x, position.y));
	document.getElementById("ball-counter").innerHTML = "Balls count: " + ballInstances.length;
}

// Interval functions

function drawFrame(ctx) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawExplosions();
	for (const cumball of ballInstances) {
		if (trailEnabled) {
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

let previosFrameTime, FPS;
function calcFPS(){
	FPS = Math.round(1000 / (performance.now() - previosFrameTime));
	previosFrameTime = performance.now();
}

function drawFPS(){	
	const uiElement = document.getElementById("fps-counter");
	uiElement.innerHTML = `FPS(target): ${FPS} (${Math.round(1000 / intervalBetweenFrames)})`

	if (FPS < Math.round(1000 / intervalBetweenFrames) - 12){
		uiElement.style.color = "red";
	}else if(FPS > Math.round(1000 / intervalBetweenFrames) + 4){
		uiElement.style.color = "green";
	}else{
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


let explosionsArray = []
function drawExplosions(){
	explosionsArray.forEach((e)=>{
		let time;
		if(e.lastFrameTime + intervalBetweenFrames < performance.now() ){
			time = performance.now();
			e.lastFrameTime = time;
			e.stage += 1;
		}
		if (e.stage > e.maxStage){
			explosionsArray.splice(explosionsArray.indexOf(e),1);
		}
		const frameWidth =  explosionSprites.width - explosionSprites.width / e.stage;
		ctx.drawImage(explosionSprites, frameWidth, 0, 96, 96, e.x - 48, e.y - 48, 96, 96);
	})
}
function updateCumballs() {
	for (const cumball of ballInstances) {
		cumball.update();
	}
	calcFPS();
}

function autoDeploy() {
	if (deployEnabled) {
		addXtraCumBall({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
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

setInterval(drawFrame, intervalBetweenFrames, ctx);
setInterval(drawFPS, 50);
let updateInterval = setInterval(updateCumballs, intervalBetweenFrames);
let autoDeployInterval = setInterval(autoDeploy, intervalBetweenBallDeploy);
