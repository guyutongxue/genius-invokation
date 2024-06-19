import type { ViteDevServer } from "vite";
import { BASE, IS_PRODUCTION } from "../config";

export let vite: ViteDevServer | null = null;

if (IS_PRODUCTION) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base: BASE,
  });
}
