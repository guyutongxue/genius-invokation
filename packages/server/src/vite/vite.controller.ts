import { Controller, Get, Req, Res } from "@nestjs/common";
import type { FastifyRequest, FastifyReply } from "fastify";
import { BASE, IS_PRODUCTION } from "../config";
import path from "node:path";
import { generateHydrationScript } from "solid-js/web";
import { vite } from "./dev_server";

const TEMPLATE_INDEX_HTML_PATH = path.join(
  import.meta.dirname,
  "../../index.html",
);
const PRODUCTION_INDEX_HTML_PATH = path.join(
  import.meta.dirname,
  "../../dist/index.html",
);
const SSR_MODULE_PATH = path.join(
  import.meta.dirname,
  "../../web/entry-server.tsx",
);

const PRODUCTION_INDEX_HTML = IS_PRODUCTION
  ? await Bun.file(PRODUCTION_INDEX_HTML_PATH).text()
  : null;

type RenderFn = () => { html: string };

@Controller()
export class ViteController {

  @Get("*")
  async serveHtml(@Req() request: FastifyRequest, @Res() response: FastifyReply) {
    const url = request.originalUrl.replace(BASE, "");
    let template: string;
    let render: RenderFn;
    if (vite) {
      template = await Bun.file(TEMPLATE_INDEX_HTML_PATH).text();
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule(SSR_MODULE_PATH))
        .render;
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
  }
}
