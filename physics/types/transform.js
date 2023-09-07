class Transform {
	constructor(position, scale = new Scale(1,1), rotationZ = 0) {
		this.position = position;
		this.scale = scale;
		this.rotation = rotationZ;
	}
}