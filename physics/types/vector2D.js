class Vector2D {
    constructor(x, y){
      this.x = x;
      this.y = y;
    }
  
    add(vector){
      this.x += vector.x;
      this.y += vector.y;
      return this;
    }
  
    sub(vector){
      this.x -= vector.x;
      this.y -= vector.y;
      return this;
    }
  
    mul(scale){
      this.x *= scale;
      this.y *= scale;
      return this;
    }
  
    dot(vector) {
      return this.x * vector.x + this.y * vector.y;
    }
  
    cross(vector) {
      return this.x * vector.y - this.y * vector.x;
    }
  
    get magnitude() {
      return Math.sqrt(this.x ** 2 + this.y ** 2);
    }
  
    normalize() {
      const magnitude = this.magnitude;
      if (magnitude !== 0) {
        this.x /= magnitude;
        this.y /= magnitude;
      }
      return this;
    }
  
    distanceTo(vector){
      const dx = vector.x - this.x;
      const dy = vector.y - this.y;
      return Math.sqrt(dx ** 2 + dy ** 2);
    }
  
    clone() {
      return new Vector2D(this.x, this.y);
    }
  
    isZero() {
      return this.x === 0 && this.y === 0;
    }
  
    reset(){
      this.x = 0;
      this.y = 0;
      return this;
    }
  }

class Scale extends Vector2D { }