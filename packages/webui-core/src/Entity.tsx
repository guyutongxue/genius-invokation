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

import type { EntityData } from "@gi-tcg/typings";
import { Image } from "./Image";
import { Show } from "solid-js";
import { Interactive } from "./Interactive";

export interface EntityProps {
  data: EntityData;
}

export function Summon(props: EntityProps) {
  return (
    <Interactive
      class="relative h-15 w-15 rounded-lg"
      id={props.data.id}
      definitionId={props.data.definitionId}
    >
      <div
        class="h-full w-full entity absolute top-0 left-0 z-5 rounded-lg"
        data-highlight={props.data.usagePerRoundHighlight}
      />
        <Image
          imageId={props.data.definitionId}
          class="h-full w-full rounded-lg entity"
        />
      <Show when={props.data.variable !== null}>
        <div class="absolute right-0 top-0 bg-white b-1 b-solid b-black w-6 h-6 rounded-3 translate-x-[50%] translate-y-[-50%] flex justify-center items-center z-10">
          {props.data.variable}
        </div>
      </Show>
      <Show when={props.data.hintIcon !== null}>
        <div class="absolute h-5 min-w-0 left-0 bottom-0 bg-white bg-opacity-70 flex items-center">
          <Image
            imageId={props.data.hintIcon!}
            class="h-4 w-4 left-0 bottom-0"
          />
          {props.data.hintText}
        </div>
      </Show>
    </Interactive>
  );
}

export { Summon as Support };

export function Status(props: EntityProps) {
  return (
    <Interactive
      class="relative h-5 w-5"
      id={props.data.id}
      definitionId={props.data.definitionId}
    >
      <Image imageId={props.data.definitionId} class="h-5 w-5" />
      <Show when={props.data.variable !== null}>
        <div class="absolute bottom-0 right-0 text-xs">
          {props.data.variable}
        </div>
      </Show>
    </Interactive>
  );
}
