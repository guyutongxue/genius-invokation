import { JSX, Show, createResource, splitProps } from "solid-js";

import { getAssetPath } from "./config";

export interface ImageProps extends JSX.HTMLAttributes<HTMLDivElement> {
  imageId: number;
  width?: number;
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
  const [local, restProps] = splitProps(props, ["imageId", "width"]);
  const [url] = createResource(() => tryFetch(local.imageId));
  return (
    <div
      {...restProps}
      style={{ width: local.width ? `${local.width}px` : void 0 }}
    >
      <Show
        when={url.state === "ready"}
        fallback={
          <div class="w-full h-full bg-gray-200 flex items-center justify-center">
            {local.imageId}
          </div>
        }
      >
        <img class="w-full h-full object-cover" src={url()} alt={`id = ${local.imageId}`} draggable={false} />
      </Show>
    </div>
  );
}
