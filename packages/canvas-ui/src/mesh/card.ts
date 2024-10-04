import { Vector3 } from "@babylonjs/core";

const CARD_RATIO = 7.2 / 4.2;

export function createCardShape(size: number) {
  const radius = 0.33 / 4.2;
  const dTheta = Math.PI / 32;

  //Polygon shape in XoZ plane
  const shape = [];

  //bottom left corner
  let centerX = radius;
  let centerZ = radius;
  for (let theta = Math.PI; theta <= 1.5 * Math.PI; theta += dTheta) {
    shape.push(
      new Vector3(
        centerX + radius * Math.cos(theta),
        0,
        centerZ + radius * Math.sin(theta),
      ),
    );
  }

  const width = size;
  const height = size *CARD_RATIO;

  //bottom right corner
  centerX = width - radius;
  for (let theta = 1.5 * Math.PI; theta <= 2 * Math.PI; theta += dTheta) {
    shape.push(
      new Vector3(
        centerX + radius * Math.cos(theta),
        0,
        centerZ + radius * Math.sin(theta),
      ),
    );
  }

  //top right corner
  centerZ = height - radius;
  for (let theta = 0; theta <= 0.5 * Math.PI; theta += dTheta) {
    shape.push(
      new Vector3(
        centerX + radius * Math.cos(theta),
        0,
        centerZ + radius * Math.sin(theta),
      ),
    );
  }

  //top left corner
  centerX = radius;
  for (let theta = 0.5 * Math.PI; theta <= Math.PI; theta += dTheta) {
    shape.push(
      new Vector3(
        centerX + radius * Math.cos(theta),
        0,
        centerZ + radius * Math.sin(theta),
      ),
    );
  }
  return shape;
}
