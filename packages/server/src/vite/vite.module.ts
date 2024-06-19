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
import { ViteService } from "./vite.service";

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
      providers: [ViteService],
      controllers: [ViteController],
    };
  }

  constructor(private vite: ViteService) {}

  configure(consumer: MiddlewareConsumer) {
    if (this.vite.devServer) {
      consumer.apply(this.vite.devServer.middlewares);
    }
  }
}
