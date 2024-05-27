import { createResource } from "solid-js";

export const [names] = createResource(() =>
  (import("./names.json") as Promise<{ default: Record<number, string> }>).then(
    (r) => r.default,
  ),
);

export const getName = (id: number) =>
  names.loading ? String(id) : names()![id] ?? String(id);
