# `@gi-tcg/data` Standard Card Data for Genius Invokation

> **Warning**
>
> This is an ESM-only package.  
> If you're using `tsc` and `moduleResolution: "Node16"`, enable `skipLibCheck: true`. We cannot make typings compatible with `Node16` for now.

## Usage

```js
import data from "@gi-tcg/data";
import { Game } from "@gi-tcg/core";

const game = new Game({
  data,
  // other options...
});
```

