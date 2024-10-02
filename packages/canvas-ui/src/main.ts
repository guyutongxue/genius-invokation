import { App } from "./app";

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

const app = new App(canvas);
app.run();
