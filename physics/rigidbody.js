class Rigidbody{
    constructor(componentManager){
        this.transform = componentManager.getComponent(Transform);
        this.velocity = new Vector2D(0, 0);
        this.friction = .3;
        this.damping = .01;
    }

    update(){
        if (this.velocity.isNearZero){
			this.velocity.reset();
		}
		this.transform.position = this.transform.position.add(this.velocity);
		this.velocity.y += gravity;

        this.velocity = this.velocity.mul( 1 - this.damping);

        if (this.transform.position.y + 4 >= canvas.height){
            this.velocity.y *= -1 * this.friction;
        }

        }

}