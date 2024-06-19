import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { ViteDevServer } from "vite";
import { BASE, IS_PRODUCTION } from "../config";


@Injectable()
export class ViteService implements OnModuleInit {
  public devServer: ViteDevServer | null = null;
  async onModuleInit() {
    if (IS_PRODUCTION) {
      const { createServer } = await import("vite");
      this.devServer = await createServer({
        server: { middlewareMode: true },
        appType: "custom",
        base: BASE,
      });
    }
  }
}
