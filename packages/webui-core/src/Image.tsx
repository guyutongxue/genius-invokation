import { ComponentProps, Show, createResource, splitProps } from "solid-js";
import { usePlayerContext } from "./Chessboard";

export interface ImageProps extends ComponentProps<"img"> {
  imageId: number;
}

const cachedObjectUrls = new Map<string, string>();
async function cachedFetch(url: string): Promise<string> {
  if (cachedObjectUrls.has(url)) {
    return cachedObjectUrls.get(url)!;
  }
  return fetch(url)
    .then((r) => r.blob())
    .then((blob) => {
      const objectUrl = URL.createObjectURL(blob);
      cachedObjectUrls.set(url, objectUrl);
      return objectUrl;
    });
}

export function Image(props: ImageProps) {
  const [local, rest] = splitProps(props, ["imageId", "width", "height"]);
  const { assetApiEndpoint } = usePlayerContext();
  const [url] = createResource(() => cachedFetch(`${assetApiEndpoint}/images/${local.imageId}`));
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
