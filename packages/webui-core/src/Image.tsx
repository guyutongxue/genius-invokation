import { ComponentProps, Show, createResource, splitProps } from "solid-js";
import { usePlayerContext } from "./Chessboard";
import { cached } from "./fetch";

export interface ImageProps extends ComponentProps<"img"> {
  imageId: number;
}

export function Image(props: ImageProps) {
  const [local, rest] = splitProps(props, ["imageId", "width", "height"]);
  const { assetApiEndpoint } = usePlayerContext();
  const [url] = createResource(() => cached(`${assetApiEndpoint()}/images/${local.imageId}?thumb=1`));
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
