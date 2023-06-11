import { Application } from "./elements.js";

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
