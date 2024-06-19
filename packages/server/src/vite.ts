import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import fastifyStatic from "@fastify/static";
import { BASE, IS_PRODUCTION } from "./config";
import path from "node:path";
import { generateHydrationScript } from "solid-js/web";
import type { ViteDevServer } from "vite";

const TEMPLATE_INDEX_HTML_PATH = path.join(
  import.meta.dirname,
  "../index.html",
);
const PRODUCTION_INDEX_HTML_PATH = path.join(
  import.meta.dirname,
  "../dist/index.html",
);
const SSR_MODULE_PATH = path.join(
  import.meta.dirname,
  "../web/entry-server.tsx",
);

const PRODUCTION_INDEX_HTML = IS_PRODUCTION
  ? await Bun.file(PRODUCTION_INDEX_HTML_PATH).text()
  : null;

let vite: ViteDevServer | null = null;
if (!IS_PRODUCTION) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base: BASE,
  });
}

type RenderFn = () => { html: string };

export async function applyVite(app: NestFastifyApplication) {
  if (vite) {
    app.use(vite.middlewares);
  } else {
    app.register(fastifyStatic, {
      root: path.join(import.meta.dirname, "../dist"),
    });
  }
  app
    .getHttpAdapter()
    .get("*", async (request: FastifyRequest, response: FastifyReply) => {
      try {
        const url = request.originalUrl.replace(BASE, "");
        let template: string;
        let render: RenderFn;
        if (vite) {
          template = await Bun.file(TEMPLATE_INDEX_HTML_PATH).text();
          template = await vite.transformIndexHtml(url, template);
          render = (await vite.ssrLoadModule(SSR_MODULE_PATH)).render;
        } else {
          template = PRODUCTION_INDEX_HTML!;
          render = (await import(SSR_MODULE_PATH)).render;
        }
        const rendered = render();
        const head = generateHydrationScript();
        const html = template
          .replace(`<!--app-head-->`, head)
          .replace(`<!--app-html-->`, rendered.html);
        return response.type("text/html").send(html);
      } catch (e) {
        console.error(e);
        return response.code(500).send({
          message: e instanceof Error ? e.message : e,
        });
      }
    });
}
