///
/// Датаклассы
///

class Vector2D {
	constructor(x, y){
		this.x = x;
		this.y = y;
	}
	add(vector){
		this.x += vector.x;
		this.y += vector.y;
	}

	sum(vector){
		new Vector2D(this.x + position.x, this.y + vector.y);
	}

	sub(vector){
		new Vector2D(this.x - position.x, this.y - vector.y);
	}

	mul(scale){
		new Vector2D(this.x * position.x, this.y * vector.y);
	}

	dot(vector) {
		return this.x * vector.x + this.y * vector.y;
	}

	get magnitude() {
		return Math.sqrt(this.x ** 2 + this.y ** 2);
	}

	get distanceTo(vector){
		return this.sub(vector).magnitude;
	}

	get isNearZero(){
		return this.length <= 0.01;
	}

	reset(){
		this.x = 0;
		this.y = 0;
	}

	
}

class Scale extends Vector2D { }

///
/// Физика
///

class Transform {
	constructor(position, scale = new Scale(1,1), rotationZ = 0) {
		this.transform = this;
		this.position = position;
		this.scale = scale;
		this.rotation = rotationZ;
		this.collider = null;
		this.rigidbody = null;
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
      	return collider.trans.pos.sub(this.trans.pos).magnitude <= this.radius + collider.radius;
	}

	intersects(colliders){
		let colliderList = Array.from(colliders);
		colliderList.splice(colliderList.indexOf(this.trans.collider),1);
		for (const collider of colliderList) {
			colliderList.splice(colliderList.indexOf(collider),1);
			if (collider.trans.pos.sub(this.trans.pos).magnitude <= this.trans.collider.radius + collider.radius){
				this.trans.rigidbody.collide(collider);				
			}
		}
	}	

	moveOutOfCollision(a, b) {
        /*********************************************************
            Find the positions of the balls when the collision occurred.
            (because right they have collided - they're overlapping)

            old a.position = a.position - T * a.velocity
            old b.position = b.position - T * b.velocity

            In this moment T is unknown. Solve this equation to find T:
            distance(old a.position, old b.position) = (a.radius + b.radius)

            This can be solved using the Quadratic formula, because after simplifying
            the left side of the equation we'll get something like: a*(T^2) + b*T + c = 0
        *********************************************************/
		let arb = a.trans.rigidbody;
		let brb = b.trans.rigidbody;
        var v = arb.velocity.sub(brb.velocity);
        var p = a.trans.position.sub(b.trans.position);
        var r = a.trans.collider.radius + b.trans.collider.radius;

        // quadratic formula coeficients
        var a = v.X*v.X + v.Y*v.Y;
        var b = (-2)*(p.X*v.X + p.Y*v.Y);
        var c = p.X*p.X + p.Y*p.Y - r*r;

        // quadratic formula discriminant
        var d = b*b - 4*a*c;

        // t1 and t2 from the quadratic formula (need only the positive solution)
        var t = (-b - Math.sqrt(d)) / (2*a);
        if (t < 0)
            t = (-b + Math.sqrt(d)) / (2*a);

        // calculate the old positions (positions when the collision occurred)
        var oldPosition1 = arb.position.sub(arb.velocity.mult(t));
        var oldPosition2 = brb.position.sub(brb.velocity.mult(t));

        var maxChange = a.trans.collider.radius * 3;

        if ((a == 0) || (d < 0) ||
            (oldPosition1.distance(arb.position) > maxChange) ||
            (oldPosition2.distance(brb.position) > maxChange)) {
            // 1) if 'a' is reset then both balls have equal velocities, no solution
            // 2) the discriminant shouldn't be negative in this simulation, but just in case check it
            // 3) the chages are too big, something is wrong

            if (arb.trans.position.distance(b.position) == 0) {
                // move only one ball up
                arb.trans.position = arb.trans.position.add(new Vector2D(0, -r));
            } else {
                // move both balls using the vector between these positions
                var diff = (r - a.position.distance(b.position)) / 2;
                arb.trans.position = arb.trans.position.add(a.position.sub(b.position).tryNormalize().mult(diff));
                arb.trans.position = arb.trans.position.add(b.position.sub(a.position).tryNormalize().mult(diff));
            }
        } else {
            // use the old positions
            arb.trans.position = oldPosition1;
            arb.trans.position = oldPosition2;
        }
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
		this.transform = transform;
		this.velocity = new Vector2D(0,0);
		this.gravityMultiplier = gravityMultiplier;
		this.bounceness = bounceness;
		this.friction = friction;
	}

	setVelocity(x, y){
		this.velocity = new Vector2D(x, y);
	}

	collide(other){
		let vela = this.velocity;
		let velb = new Vector2D(0,0);
		if (other.trans.rigidbody != null){
			vela = other.rigidbody.velocity;
		}
		const positionSub = other.position.sub(this.position);
		const coeff = (vela.sub(velb).dot(positionSub)) / (Math.pow(positionSub.magnitude,2));
		this.velocity = vela.sub(positionSub.mul(coeff));
		other.rigidbody.velocity = vela.sub(positionSub.mul(coeff * -1));
		console.log(this.velocity);		
	}

	tick(timeElapsed){
		if (this.velocity.isNearZero){
			this.velocity.reset();
		}
		this.position.add(this.velocity);
		
		this.velocity.y += gravity;
		
		
	}
}

class StaticObstacle{
	constructor(x, y){
		this.transform = new Transform(new Vector2D(x,y), new Scale(100, 30));
		this.transform.collider = new BoxCollider(this.transform);
	}	
}

class Ball extends Transform{
	constructor(position, radius) {
		super(position, new Vector2D(radius, radius), 0);
		this.collider = new CircleCollider(this.transform, radius);
		this.rigidbody = new PhysicsObject(this.transform);
		const random = performance.now();

		//this.diameter = diameter;
		const angle = random % Math.PI * 2;
		const acceleration = random % 16;

		this.transform.rigidbody.setVelocity(Math.cos(angle) * acceleration, Math.sin(angle) * acceleration);

		// Принудительно обновляем физику
		//this.fixedUpdate();
	}

	fixedUpdate(timeElapsed) {	
		this.lastTickTime = timeElapsed;
		this.transform.rigidbody.tick(timeElapsed);
		/*if (this.transform.pos.y + this.transform.collider.radius >= canvas.height){
			this.transform.rigidbody.setVelocity(this.transform.rigidbody.velocity.x, -this.transform.rigidbody.velocity.y * 0.5);
		}*/
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
	others() {
		return this.#objects.others();
	}
	values() {
		return this.#objects.values();
	}
	removeFirst = function* (amount) {
		while (amount-- > 0 && this.size > 0) {
			const other = this.#objects.others().next().value;
			const object = this.#objects.get(other);

			this.#objects.delete(other);
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
