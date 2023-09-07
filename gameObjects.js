/*

class StaticObstacle extends Transform{
	constructor(x, y){
		super(new Vector2D(x,y), new Scale(100, 30));
		this.transform.collider = new BoxCollider(this.transform);
	}	
}

class Ball extends Transform{
	constructor(position, radius) {
		super(position, new Vector2D(radius, radius), 0);
		this.collider = new CircleCollider(this.transform, radius);
		this.rigidbody = new PhysicsObject(this.transform);
		

		const angle = random % Math.PI * 2;
		const acceleration = random % 16;

		this.rigidbody.setVelocity(Math.cos(angle) * acceleration, Math.sin(angle) * acceleration);

		// Принудительно обновляем физику
		//this.fixedUpdate();
	}

	fixedUpdate(timeElapsed) {	
		this.lastTickTime = timeElapsed;
		this.rigidbody.tick(timeElapsed);
		if (this.transform.pos.y + this.transform.collider.radius >= canvas.height){
			this.transform.rigidbody.setVelocity(this.transform.rigidbody.velocity.x, -this.transform.rigidbody.velocity.y * 0.5);
		}
	};

	update(){
	}
};*/

class NewBall extends ComponentManager{
	constructor(position){
		super();
		const random = performance.now();

		this.poly = convertCircleToPolygon(position, 8, 16);

		this.transform = new Transform(position);
		this.ComponentManager.addComponent(this.transform);
		
		this.rigidbody = new Rigidbody(this.ComponentManager);
		this.ComponentManager.addComponent(this.rigidbody);

		this.collider = new Collider(this.ComponentManager, this.poly);
		colliderGlobalStorage.add(this.collider);
		this.ComponentManager.addComponent(this.collider);

		const angle = random % Math.PI * 2;
		const acceleration = random % 16;

		this.rigidbody.velocity = this.rigidbody.velocity.add(new Vector2D(Math.cos(angle) * acceleration, Math.sin(angle) * acceleration));
	}

	update(){
		this.rigidbody.update();
		for(const collider of colliderGlobalStorage.values()){
			if (collider != this.collider){
				if(this.collider.isIntersecting(collider.polygon)){
					this.collider.collide(collider);
				}
			}
		}
	}
}