import path from "node:path";

import {
  Module,
  type DynamicModule,
  type MiddlewareConsumer,
  type NestModule,
} from "@nestjs/common";
import { IS_PRODUCTION } from "../config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { ViteController } from "./vite.controller";
import { vite } from "./dev_server";

@Module({})
export class ViteModule implements NestModule {
  static forRoot(): DynamicModule {
    const imports: DynamicModule[] = [];
    if (IS_PRODUCTION) {
      imports.push(
        ServeStaticModule.forRoot({
          rootPath: path.join(import.meta.dirname, "../dist"),
        }),
      );
    }
    return {
      module: ViteModule,
      imports,
      controllers: [ViteController],
    };
  }

  configure(consumer: MiddlewareConsumer) {
    if (vite) {
      consumer.apply(vite.middlewares);
    }
  }
}
