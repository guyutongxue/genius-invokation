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
import "@babylonjs/core/Meshes/Builders/";


import { ActionCard } from "./action_card";

export class App {
  engine: Engine;
  private resizeObserver: ResizeObserver;
  readonly scene: Scene;
  constructor(public readonly canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { stencil: true });
    this.resizeObserver = new ResizeObserver(() => {
      this.engine.resize();
    });
    this.resizeObserver.observe(canvas);
    this.scene = createScene(this.engine, this.canvas);
  }

  async run() {
    Inspector.Show(this.scene, {});
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }
}

function createScene(
  engine: Engine,
  canvas: HTMLCanvasElement,
): Scene {
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

  const light = new HemisphericLight("light", new Vector3(-1, 2, 1), scene);
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

  scene.onPointerUp = () => {
    const card = new ActionCard(scene);
    card.show(0,1,0);
  }

  return scene;
}
