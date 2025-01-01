import pm2 from "pm2";
import { promisify } from "node:util";
import { $ } from "bun";

const appName = (await $`bun run app-name`.text()).trim();

await promisify(pm2.connect.bind(pm2))();
await using _ = {
  async [Symbol.asyncDispose]() {
    await promisify(pm2.disconnect.bind(pm2))();
  }
}
const processes = await promisify(pm2.list.bind(pm2))();

const server = processes.find((p) => p.name === appName);

console.log(server?.pm2_env?.status ?? "stopped");
