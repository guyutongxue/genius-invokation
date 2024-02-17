// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import {
  ComponentProps,
  Show,
  createResource,
  splitProps,
  JSX,
  For,
} from "solid-js";
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
  const [data] = createResource(() =>
    cached(`${assetApiEndpoint()}/data/${local.definitionId}`)
      .then(fetch)
      .then((r) => r.json()),
  );
  const description = (): JSX.Element => {
    const { description, skills } = data();
    if (description) {
      return description;
    } else if (Array.isArray(skills)) {
      return (
        <ul class="clear-both m-0">
          <For each={skills}>
            {(s) => (
              <li>
                <strong>{s.name}</strong>
                &nbsp; {s.description}
              </li>
            )}
          </For>
        </ul>
      );
    } else {
      return "";
    }
  };
  return (
    <div {...rest}>
      <div class="max-h-70 w-50 rounded-md bg-yellow-100 cursor-auto p-1 overflow-x-auto shadow-md text-start">
        <Image imageId={local.definitionId} class="w-10 float-left mr-1" />
        <h3 class="mt-1 mb-2">
          {data.state === "ready" ? data().name : "加载中"}{" "}
        </h3>
        <Show when={data.state === "ready"}>
          <div class="text-sm whitespace-pre-wrap">{description()}</div>
        </Show>
        <div class="clear-both pt-1 text-[0.6rem] text-gray">
          定义 id {local.definitionId}
          {local.entityId && ` · 实体 id ${local.entityId}`}
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
