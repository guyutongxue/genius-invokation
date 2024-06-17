import { Show, createResource } from "solid-js";
import { useDeckBuilderContext } from "./DeckBuilder";

export interface CardProps {
  id: number;
  name: string;
  partialSelected?: boolean;
  selected?: boolean;
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
  const [srcUrl] = createResource(
    () => props.id,
    (id) => cachedFetch(`${assetApiEndpoint()}/images/${id}?thumb=1`),
  );
  return (
    <div
      title={props.name}
      data-selected={props.selected}
      data-partial-selected={props.partialSelected}
      class="w-full rounded-lg overflow-clip data-[selected=true]:border-green data-[partial-selected=true]:border-yellow border-2 border-transparent"
    >
      <Show
        when={srcUrl()}
        fallback={
          <div class="w-full aspect-ratio-[7/12] bg-gray-200">{props.name}</div>
        }
      >
        {(url) => <img src={url()} alt={props.name} draggable="false" />}
      </Show>
    </div>
  );
}
