import { Application } from "@jenshin-tcg/typings";

export interface Status {
  name: string;
  how: any; // TODO
};

export interface Character {
  id: number;
  health: number;
  applied: Application;
  statuses: Status[];
}
