import { ComponentProps, Show, createResource, splitProps } from "solid-js";
import { usePlayerContext } from "./Chessboard";
import { Image } from "./Image";
import { cached } from "./fetch";

export type TypeKey =
  | "tcgcharactercards"
  | "tcgactioncards"
  | "tcgsummons"
  | "tcgstatuseffects"
  | "tcgkeywords";

export interface CardDescrptionProps extends ComponentProps<"div"> {
  definitionId: number;
  entityId?: number;
  type?: TypeKey;
}

export function CardDescription(props: CardDescrptionProps) {
  const [local, rest] = splitProps(props, ["definitionId", "entityId", "type"]);
  const { assetApiEndpoint } = usePlayerContext();
  const [data] = createResource(() => cached(`${assetApiEndpoint}/data/${local.definitionId}`).then(fetch).then((r) => r.json()));
  const description = (): string => {
    const { description, skills } = data();
    if (description) {
      return description;
    } else if (Array.isArray(skills)) {
      return skills.filter((s) => s.typetag === "GCG_SKILL_TAG_PASSIVE").map((s) => s.description).join("\n");
    } else {
      return "";
    }
  };
  return (
    <div {...rest}>
      <div class="max-h-70 w-50 rounded-md bg-yellow-100 cursor-auto p-1 overflow-x-auto shadow-md">
        <Image imageId={local.definitionId} class="w-10 float-left mr-1" />
        <h3 class="mt-1 mb-2">{ data.state === "ready" ? data().name : "加载中" } </h3>
        <Show when={data.state === "ready"}>
          <div class="text-sm whitespace-pre-wrap">
            { description() }
          </div>
        </Show>
        <div class="clear-both pt-1 text-[0.6rem] text-gray">
          定义 id {local.definitionId}{ local.entityId && ` · 实体 id ${local.entityId}` }
        </div>
      </div>
    </div>
  );
}

export interface RootCardDescriptionProps {
  show: boolean;
  id: number;
  definitionId: number;
  x: number;
  y: number;
}
