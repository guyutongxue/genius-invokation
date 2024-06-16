import { Show, createResource } from "solid-js";
import { useDeckBuilderContext } from "./DeckBuilder";

export interface CardProps {
  id: number;
  name: string;
}

const cache = new Map<string, string>();
const cachedFetch = async (url: string) => {
  if (cache.has(url)) {
    return cache.get(url)!;
  }
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  cache.set(url, objectUrl);
  return objectUrl;
};

export function Card(props: CardProps) {
  const { assetApiEndpoint } = useDeckBuilderContext();
  const [srcUrl] = createResource(() =>
    cachedFetch(`${assetApiEndpoint()}/images/${props.id}?thumb=1`),
  );
  return (
    <div title={props.name} class="w-[60px]">
      <Show
        when={srcUrl()}
        fallback={
          <div class="w-full aspect-ratio-[7/12] rounded-xl bg-indigo-900 text-white">
            {props.name}
          </div>
        }
      >
        {(url) => <img src={url()} alt={props.name} />}
      </Show>
    </div>
  );
}
