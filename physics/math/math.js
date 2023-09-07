function isSeparatingAxis(edge, poly1, poly2) {
    const projection1 = projectPolygon(poly1, edge);
    const projection2 = projectPolygon(poly2, edge);

    return !(projection1.max < projection2.min || projection2.max < projection1.min)
}

function projectPolygon(polygon, axis) {
  let min = Number.MAX_VALUE;
  let max = Number.MIN_VALUE;
  for (const point of polygon) {
    let projection = point.dot(axis);

    if (projection < min) {
      min = projection;
    }

    if (projection > max) {
      max = projection;
    }
  }

  return { min, max };
}

function convertCircleToPolygon(center, radius, resolution = 8){
  const poly = [];
  const angleStep = (2 * Math.PI) / resolution;

  for (let i = 0; i < resolution; i++) {
    const x = radius * Math.cos(i * angleStep);
    const y = radius * Math.sin(i * angleStep);
    poly.push(new Vector2D(x, y).add(center));
  }
  return poly;
}

