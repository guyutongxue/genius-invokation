import {
  Color3,
  Color4,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  Vector4,
} from "@babylonjs/core";
import earcut from "earcut";

function randomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export class ActionCard {
  readonly flare: Texture;

  constructor(private readonly scene: Scene) {
    this.flare = new Texture(
      "https://assets.babylonjs.com/textures/flare.png",
      scene,
    );
  }
  width = 1;
  height = 7.2 / 4.2;

  private showParticle(x: number, y: number, z: number) {
    const particleSystem = new ParticleSystem("particles", 500, this.scene);
    // const particleSystem = ParticleHelper.CreateDefault(null, 500, scene);
    particleSystem.particleTexture = this.flare;

    particleSystem.minSize = 0;
    particleSystem.maxSize = 0;

    particleSystem.minLifeTime = 1;
    particleSystem.maxLifeTime = 1;

    particleSystem.emitRate = 500;
    particleSystem.updateSpeed = 0.05;
    particleSystem.disposeOnStop = true;

    particleSystem.color1 = new Color4(0.2, 0.2, 0, 0.0);
    particleSystem.color2 = new Color4(0.8, 0.8, 0.2, 1.0);
    particleSystem.colorDead = new Color4(1.0, 1.0, 0.7, 1.0);

    const startX = x;
    const startZ = z;
    const endX = startX + this.width;
    const endZ = startZ + this.height;

    particleSystem.startPositionFunction = (worldMatrix, positionToUpdate) => {
      const x = randomNumber(startX, endX);
      const z = randomNumber(startZ, endZ);
      Vector3.TransformCoordinatesFromFloatsToRef(
        x,
        y,
        z,
        worldMatrix,
        positionToUpdate,
      );
    };

    // const finalSize = 0.5;
    const sizeStep = 0.03;

    const { promise, resolve, reject } = Promise.withResolvers();

    particleSystem.updateFunction = function (particles) {
      let retired = 0;
      // @ts-expect-error private prop
      const speed = this._scaledUpdateSpeed;
      // @ts-expect-error private prop
      const colorStep = this._scaledColorStep;
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        let multiplier = 1;
        if (particle.age >= particle.lifeTime) {
          retired++;
          continue;
        } else if (particle.age >= (particle.lifeTime * 2) / 3) {
          multiplier = -2;
          resolve();
        } 
        particle.age += speed;
        particle.size += multiplier * sizeStep;
        if (particle.size < 0) {
          particle.size = 0;
        }
        particle.colorStep.scaleToRef(multiplier * speed, colorStep);
        particle.color.addInPlace(colorStep);
        if (particle.color.a < 0) {
          particle.color.a = 0;
        }
        // particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
        // particle.position.addInPlace(this._scaledDirection);
      }
      if (particles.length > 0 && retired === particles.length) {
        this.stop();
        this.dispose();
      }
    };

    particleSystem.start();

    return promise;
  }

  private async showCard(x: number, y: number, z: number) {
    const mat = new StandardMaterial("");
    mat.specularPower = 0;
    mat.specularColor = Color3.Black();

    const dynTexture = new DynamicTexture(
      "",
      { width: 420, height: 720 },
      this.scene,
      true,
    );
    dynTexture.level = 1.6;

    const ctx = dynTexture.getContext();

    const image = new Image();
    const { promise, resolve } = Promise.withResolvers();
    image.onload = resolve;
    image.src =
      "https://gi-tcg-assets.guyutongxue.site/assets/UI_Gcg_CardFace_Assist_NPC_Paimon.webp";
    image.crossOrigin = "anonymous";
    await promise;

    const W = 10;

    ctx.drawImage(image, 0, 0, 420, 720);

    ctx.strokeStyle = "#765f33";
    ctx.lineWidth = W;

    ctx.beginPath();
    const R = 30;
    ctx.moveTo(420 - R - W / 2, W / 2);
    ctx.arc(420 - R - W / 2, R + W / 2, R, -Math.PI / 2, 0);
    ctx.lineTo(420 - W / 2, 720 - R - W / 2);
    ctx.arc(420 - R - W / 2, 720 - R - W / 2, R, 0, Math.PI / 2);
    ctx.lineTo(R + W / 2, 720 - W / 2);
    ctx.arc(R + W / 2, 720 - R - W / 2, R, Math.PI / 2, Math.PI);
    ctx.lineTo(W / 2, R + W / 2);
    ctx.arc(R + W / 2, R + W / 2, R, -Math.PI, -Math.PI / 2);
    ctx.closePath();
    ctx.stroke();
    // ctx.strokeRect(0, 0, 420, 720);

    dynTexture.update();

    // mat.disableLighting = true;
    // mat.emissiveTexture = dynTexture;
    // mat.emissiveTexture.hasAlpha = true;
    // mat.opacityTexture = dynTexture;
    mat.diffuseTexture = dynTexture;
    mat.useAlphaFromDiffuseTexture = true
    const f = new Vector4(0, 0, 1, 1); // front image = half the whole image along the width
    // const b = new BABYLON.Vector4(0.5,0, 1, 1); // back image = second half along the width

    // const plane = BABYLON.MeshBuilder.CreatePlane("plane", { width: 1, height: 7.2/4.2, frontUVs: f, sideOrientation: BABYLON.Mesh.FRONTSIDE});

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

    //bottom right corner
    centerX = this.width - radius;
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
    centerZ = this.height - radius;
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

    const plane = MeshBuilder.CreatePolygon("polygon", {
      shape,
      frontUVs: f,
      sideOrientation: Mesh.FRONTSIDE,
    }, this.scene, earcut);
    plane.position.x = x;
    plane.position.y = y;
    plane.position.z = z;

    plane.material = mat;
  }

  async show(x: number, y: number, z: number) {
    await this.showParticle(x, y + 0.01, z);
    await this.showCard(x, y, z);
  }
}
