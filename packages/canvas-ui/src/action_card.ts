import {
  Color3,
  Color4,
  DynamicTexture,
  FadeInOutBehavior,
  Mesh,
  MeshBuilder,
  ParticleSystem,
  Scene,
  StandardMaterial,
  Vector4,
} from "@babylonjs/core";
import earcut from "earcut";
import { loadActionCardTexture } from "./textures/action_card";
import { createCardShape } from "./mesh/card";

function randomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export class ActionCard {
  readonly fadeInOut = new FadeInOutBehavior();
  cardTexture: DynamicTexture | null = null;
  cardMaterial: StandardMaterial | null = null;
  cardMesh: Mesh | null = null;

  constructor(private readonly scene: Scene) {
    this.fadeInOut.init();
  }

  width = 1;
  height = 7.2 / 4.2;

  private async showCard(x: number, y: number, z: number) {
    this.cardTexture ??= await loadActionCardTexture(this.scene, 322001);

    // mat.disableLighting = true;
    // mat.emissiveTexture = dynTexture;
    // mat.emissiveTexture.hasAlpha = true;
    // mat.opacityTexture = dynTexture;

    this.cardMaterial ??= new StandardMaterial("");
    this.cardMaterial.specularPower = 0;
    this.cardMaterial.specularColor = Color3.Black();
    this.cardMaterial.diffuseTexture = this.cardTexture;
    this.cardMaterial.useAlphaFromDiffuseTexture = true;

    const f = new Vector4(0, 0, 1, 1);

    //Polygon shape in XoZ plane
    const shape = createCardShape(1);

    this.cardMesh ??= MeshBuilder.CreatePolygon(
      "polygon",
      {
        shape,
        frontUVs: f,
        sideOrientation: Mesh.FRONTSIDE,
      },
      this.scene,
      earcut,
    );
    this.cardMesh.position.x = x;
    this.cardMesh.position.y = y;
    this.cardMesh.position.z = z;
    this.cardMesh.material = this.cardMaterial;

    const dice = MeshBuilder.CreateGround("dice", {
      width: 0.25,
      height: 0.25,
    });
    this.cardMesh.addChild(dice);
    dice.position.x = 0;
    dice.position.y = 0.01;
    dice.position.z = this.height - 0.5;
    const diceMat = new StandardMaterial("myMaterial", this.scene);
    diceMat.diffuseColor = new Color3(1, 1, 0);
    dice.material = diceMat;

    this.fadeInOut.attach(this.cardMesh);
    this.fadeInOut.fadeIn(true);
  }

  async show(x: number, y: number, z: number) {
    await this.showCard(x, y, z);
  }

  private static readonly FADE_IN_TIME = 300;
  private static readonly FADE_OUT_TIME = 300;

  async hide() {
    this.fadeInOut.fadeOutTime = ActionCard.FADE_OUT_TIME;
    this.fadeInOut.fadeOut();
    await new Promise((r) => setTimeout(r, ActionCard.FADE_OUT_TIME));
  }

  dispose() {
    this.cardMesh?.dispose();
    this.cardMaterial?.dispose();
    this.cardTexture?.dispose();
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
