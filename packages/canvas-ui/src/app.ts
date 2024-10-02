import {
  ArcRotateCamera,
  Engine,
  HemisphericLight,
  Scene,
  Vector3,
  MeshBuilder,
  ParticleSystem,
  ParticleHelper,
  Texture,
  Color4,
} from "@babylonjs/core";
import { Inspector } from "@babylonjs/inspector";

import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Meshes/Builders/sphereBuilder";
import "@babylonjs/core/Meshes/Builders/groundBuilder";

export class App {
  engine: Engine;
  private resizeObserver: ResizeObserver;
  // scene: Scene;
  constructor(public readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { stencil: true });
    this.resizeObserver = new ResizeObserver(() => {
      this.engine.resize();
    });
    this.resizeObserver.observe(canvas);
  }

  async run() {
    const scene = await createScene(this.engine, this.canvas);
    Inspector.Show(scene, {});
    this.engine.runRenderLoop(() => {
      scene.render();
    });
  }
}

function randomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

async function createScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Promise<Scene> {
  const scene = new Scene(engine);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    0, //Math.PI / 3,
    10,
    new Vector3(0, 0, 0),
    scene,
  );
  camera.attachControl(canvas, true);

  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  const sphere = MeshBuilder.CreateSphere(
    "sphere",
    { diameter: 1, segments: 32 },
    scene,
  );
  sphere.position.x = -1;
  sphere.position.y = 1;
  // const ground = MeshBuilder.CreateGround(
  //   "ground",
  //   { width: 6, height: 6 },
  //   scene,
  // );



  const flare = new Texture(
    "https://assets.babylonjs.com/textures/flare.png",
    scene,
  );

  const particleSystem = new ParticleSystem("particles", 500, scene);
  // const particleSystem = ParticleHelper.CreateDefault(null, 500, scene);
  particleSystem.particleTexture = flare;


  particleSystem.minSize = 0;
  particleSystem.maxSize = 0;

  particleSystem.minLifeTime = 2;
  particleSystem.maxLifeTime = 2;

  particleSystem.emitRate = 500;
  particleSystem.updateSpeed = 0.05;
  particleSystem.disposeOnStop = true;

  particleSystem.color1 = new Color4(0.2, 0.2, 0, 0.0);
  particleSystem.color2 = new Color4(0.8, 0.8, 0.2, 1.0);
  particleSystem.colorDead = new Color4(1.0, 1.0, 0.7, 1.0);

  const startX = 0;
  const startZ = 0;
  const width = 1;
  const height = 7.2 / 4.2;
  const endX = startX + width;
  const endZ = startZ + height;

  particleSystem.startPositionFunction = (worldMatrix, positionToUpdate) => {
    const x = randomNumber(startX, endX);
    const z = randomNumber(startZ, endZ);
    const y = 1;
    Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, worldMatrix, positionToUpdate);
  };

  // const finalSize = 0.5;
  const sizeStep = 0.015;

  const { promise, resolve, reject } = Promise.withResolvers();

  particleSystem.updateFunction = function (particles) {
    let retired = 0;
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i];
      let multiplier = 1;
      if (particle.age >= particle.lifeTime * 2 / 3) {
        multiplier = -2;
        resolve();
      } else if (particle.age >= particle.lifeTime) {
        retired++;
        continue;
      }
      particle.age += this._scaledUpdateSpeed;
      particle.size += multiplier * sizeStep;   
      if (particle.size < 0) {
        particle.size = 0;
      }    
      particle.colorStep.scaleToRef(multiplier * this._scaledUpdateSpeed, this._scaledColorStep);
      particle.color.addInPlace(this._scaledColorStep);
      if (particle.color.a < 0) {
        particle.color.a = 0;
      }
      // particle.direction.scaleToRef(this._scaledUpdateSpeed, this._scaledDirection);
      // particle.position.addInPlace(this._scaledDirection);
    }
    if (particles.length > 0 && retired === particles.length) {
      this.stop();
    }
  }

  particleSystem.start();

  promise.then(() => console.log("HI"));
  

  return scene;
}
