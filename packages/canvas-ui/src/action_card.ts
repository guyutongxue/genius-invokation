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
import { getActionCardTexture } from "./textures/action_card";
import { createCardShape } from "./mesh/card";
import { getActionCardMaterial } from "./materials/action_card";
import { getDiceTexture } from "./textures/dice";
import { DiceType } from "@gi-tcg/typings";

function randomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export class ActionCard {
  readonly fadeInOut = new FadeInOutBehavior();
  cardMaterial: StandardMaterial | null = null;
  cardMesh: Mesh | null = null;

  private static readonly FADE_IN_TIME = 300;
  private static readonly FADE_OUT_TIME = 300;

  private static readonly WIDTH = 1;
  private static readonly HEIGHT = 7.2 / 4.2;

  constructor(private readonly scene: Scene) {
    this.fadeInOut.init();
    this.fadeInOut.fadeInTime = ActionCard.FADE_IN_TIME;
    this.fadeInOut.fadeOutTime = ActionCard.FADE_OUT_TIME;
  }

  private async showCard(x: number, y: number, z: number) {

    this.cardMaterial ??= await getActionCardMaterial(this.scene, 322001);
    const f = new Vector4(0, 0, 1, 1);

    // Polygon shape in XoZ plane
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
      width: 0.4,
      height: 0.4,
    });
    this.cardMesh.addChild(dice);
    dice.position.x = 0;
    dice.position.y = 0.01;
    dice.position.z = ActionCard.HEIGHT - 0.5;
    const diceMat = new StandardMaterial("dice_mat", this.scene);
    diceMat.diffuseTexture = getDiceTexture(DiceType.Same);
    diceMat.useAlphaFromDiffuseTexture = true;
    // diceMat.diffuseColor = new Color3(1, 1, 0);
    dice.material = diceMat;

    this.fadeInOut.attach(this.cardMesh);
    this.fadeInOut.fadeIn(true);
  }
  
  async show(x: number, y: number, z: number) {
    await this.showCard(x, y, z);
  }


  async hide() {
    this.fadeInOut.fadeOut();
    await new Promise((r) => setTimeout(r, ActionCard.FADE_OUT_TIME));
  }

  dispose() {
    this.cardMesh?.dispose();
    this.cardMaterial?.dispose();
    // this.cardTexture?.dispose();
  }

  [Symbol.dispose]() {
    this.dispose();
  }
}
