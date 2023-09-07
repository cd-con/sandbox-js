///
/// Датаклассы
///

class Position {
	constructor(x, y){
		this.x = x;
		this.y = y;
	}
	sub(position){
		return new Position(this.x - position.x, this.y - position.y);
	}

	mul(scale){
		return new Position(this.x * scale, this.y * scale);
	}

	dot(vector) {
		return this.x * vector.x + this.y * vector.y;
	}
	get magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}
	
}

class Scale extends Position { }

///
/// Физика
///

class Transform {
	constructor(position, scale = new Scale(1,1), rotationZ = 0, collider = null, rigidbody = null) {
		this.pos = position;
		this.scale = scale;
		this.rot = rotationZ;
		this.collider = collider;
		this.rigidbody = rigidbody;
	}
}

class Collider{
	constructor(transform){
		this.trans = transform;
		colliderGlobalStorage.add(this);
	}

	intersect(collider){};
	debugDraw(ctx){};
	intersects(colliderList){
		let result = new Map();
		for (const collider of colliderList) {
			result.set(collider, this.intersect(collider));
		}
		return result;
	}	
}

class BoxCollider extends Collider {
	intersect(collider){
		let colTrans = collider.trans;
		
		return !(
			((this.trans.pos.y + this.trans.scale.y / 2) < (colTrans.pos.y)) ||
			(this.trans.pos.y > (colTrans.pos.y + colTrans.scale.y / 2)) ||
			((this.trans.pos.x + this.trans.scale.x / 2) < colTrans.pos.x) ||
			(this.trans.pos.x > (colTrans.pos.x + colTrans.scale.x / 2))
		);
	}

	debugDraw(ctx){
		ctx.strokeRect(this.trans.pos.x - this.trans.scale.x / 2,
					   this.trans.pos.y - this.trans.scale.y / 2,
					   this.trans.scale.x, this.trans.scale.y);
	}
}

class CircleCollider extends Collider{
	constructor(transform, radius){
		super(transform);
		this.radius = radius;
	}

	/// Имплементация метода работает только с другими CircleCollider!
	intersect(collider){
      	return this.trans.pos.sub(collider.trans.pos).magnitude <= this.radius + collider.radius;
	}

	debugDraw(ctx){
		ctx.beginPath();
		ctx.arc(this.trans.pos.x, this.trans.pos.y, this.radius, 0, 2 * Math.PI, false);
		ctx.lineWidth = 2;
		ctx.strokeStyle = '#000000';
		ctx.stroke();
	}
}

class PhysicsObject{
	constructor(transform, gravityMultiplier = 1, bounceness = .2, friction = .5){
		this.trans = transform;
		this.velocity = new Position(0,0);
		this.gravityMultiplier = gravityMultiplier;
		this.bounceness = bounceness;
		this.friction = friction;
	}

	setVelocity(x, y){
		this.velocity = new Position(x, y);
	}

	tick(timeElapsed){
		this.velocity.y += (gravity * this.gravityMultiplier * timeElapsed) / Math.pow(canvas.height - this.trans.pos.y, 2);

		if (this.trans.collider != null){
			let intersects = this.trans.collider.intersects(colliderGlobalStorage.values())
			for(const [key, value] of intersects){
				if ((key != this.trans.collider) && value){
					let vela = new Position(0,0);
					let velb = this.velocity;
					let posa = key.trans.pos;
					let posb = this.trans.pos;
					if (key.trans.rigidbody != null){
						vela = key.trans.rigidbody.velocity;
					}					

					this.velocity = vela.sub(posa.sub(posb).mul(vela.sub(velb).dot(posa.sub(posb)) / posa.sub(posb).magnitude ** 2 ).mul(.5));						
			}
		}

		this.trans.pos.x += this.velocity.x;
		this.trans.pos.y += this.velocity.y;
	}
}
}

class StaticObstacle{
	constructor(x, y){
		this.transform = new Transform(new Position(x,y), new Scale(100, 30));
		this.transform.collider = new BoxCollider(this.transform);
	}	
}

class Ball {
	constructor(x, y, diameter = 16) {
		const random = performance.now();

		this.transform = new Transform(new Position(x,y), new Scale(diameter, diameter));
		this.transform.collider = new CircleCollider(this.transform, diameter);
		this.transform.rigidbody = new PhysicsObject(this.transform, 750);

		//this.diameter = diameter;
		const angle = random % Math.PI * 2;
		const acceleration = random % 16;

		this.transform.rigidbody.setVelocity(Math.cos(angle) * acceleration, Math.sin(angle) * acceleration);

		this.lastTickTime = 0;
		// Принудительно обновляем физику
		//this.fixedUpdate();
	}

	fixedUpdate(timeElapsed) {	
		this.lastTickTime = timeElapsed;
		this.transform.rigidbody.tick(timeElapsed);
		if (this.transform.pos.y + this.transform.collider.radius >= canvas.height){
			this.transform.rigidbody.setVelocity(this.transform.rigidbody.velocity.x, -this.transform.rigidbody.velocity.y * 0.5);
		}
	};

	update(){
	}
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

// Преработал SoundQueue в SoundEntity
// Оставил класс, так как в планах добавить ещё больше возможностей для работы со звуком
class SoundEntity
{
	constructor(clipSrc){
		this.clipSrc = clipSrc;
	}

	play(){
		if (globalSoundsCounter < soundLimiter){
			const ac = new Audio(this.clipSrc);
			ac.addEventListener('ended', () => {
				globalSoundsCounter--;
			});
            ac.play();
			globalSoundsCounter++;
		}
	}
}
