import { plugin } from "bun";

await plugin({
  name: "html",
  async setup(build) {
    build.onLoad({ filter: /\.html$/ }, async (args) => {
      return {
        exports: {
          default: await Bun.file(args.path).text()
        },
        loader: "object"
      }
    })
  }
})
