# `@gi-tcg/data` Standard Card Data for Genius Invokation

> **Warning**
>
> This is an ESM-only package.

## Usage

```js
import data from "@gi-tcg/data";
import { Game } from "@gi-tcg/core";

const state = Game.createInitialState({
  data: data(),
  // other options...
});
```

