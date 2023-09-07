class Collider{
    constructor(componentManager, polygon){
        this.transform = componentManager.getComponent(Transform);
        this.rigidbody = componentManager.getComponent(Rigidbody);
        this.polygon = polygon;
    }

    isIntersecting(poly) {
      const axes = this.polygon.concat(poly);

      // Проходимся по всем осям
      for (let axis of axes) {
        // Получаем проекции фигур на текущую ось
    
        // Проверяем пересечение проекций
        if (isSeparatingAxis(axis, poly, this.polygon)) {
          // Если проекции не пересекаются, фигуры не пересекаются
          return false;
        }
      }
    
      // Если все оси проверены и проекции пересекаются, фигуры пересекаются
      return true;
    }
    
    collide(other){
      const oRigidbody = other.rigidbody;
      const oTransform = other.transform;

      if (oRigidbody == null && this.rigidbody == null){
        return;
      }

      let vela = new Vector2D(0,0);
		  let velb = new Vector2D(0,0);

      if (this.rigidbody != null){
			  vela = this.rigidbody.velocity.clone();
		  }
		  if (oRigidbody != null){
			  velb = oRigidbody.velocity.clone();
		  }

		  const positionSub = oTransform.position.clone().sub(this.transform.position);
		  const coeff = (vela.sub(velb).dot(positionSub)) / (Math.pow(positionSub.magnitude,2));
      if (this.rigidbody != null){
			  this.rigidbody.velocity = vela.sub(positionSub.mul(coeff));
		  }
      if (oRigidbody != null){
		    oRigidbody.velocity = vela.sub(positionSub.mul(coeff * -1));
      }

    }
}