import { ComponentProps, Show, createResource, splitProps } from "solid-js";

import { getAssetPath } from "./config";

export interface ImageProps extends ComponentProps<"img"> {
  imageId: number;
}

const allAssets = new Map<number, string>();
async function tryFetch(imageId: number, retry = 5): Promise<string> {
  if (allAssets.has(imageId)) {
    return allAssets.get(imageId)!;
  }
  const assetUrl = getAssetPath(imageId);
  if (assetUrl === null) {
    return Promise.reject("asset url not found");
  }
  if (retry <= 0) {
    return Promise.reject("retry exhausted");
  }
  return fetch(assetUrl)
    .then((r) => r.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      allAssets.set(imageId, objectUrl);
      return objectUrl;
    })
    .catch(() => tryFetch(imageId, retry - 1));
}

export function Image(props: ImageProps) {
  const [local, rest] = splitProps(props, ["imageId", "width", "height"]);
  const [url] = createResource(() => tryFetch(local.imageId));
  const classNames = "flex items-center justify-center object-cover";
  const innerProps = (): ComponentProps<"img"> => ({
    ...rest,
    class: `${rest.class ?? ""} ${classNames}`,
    src: url(),
    alt: `id = ${local.imageId}`,
    draggable: "false",
    style: {
      background: url.state === "ready" ? void 0 : "#e5e7eb",
      height: local.height ? `${local.height}px` : void 0,
      width: local.width ? `${local.width}px` : void 0,
    },
  });
  return (
    <Show
      when={url.state === "ready"}
      fallback={
        <div {...(innerProps() as ComponentProps<"div">)}>{local.imageId}</div>
      }
    >
      <img {...innerProps()} />
    </Show>
  );
}
