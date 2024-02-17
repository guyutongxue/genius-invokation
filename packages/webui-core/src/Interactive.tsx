import { JSX } from "solid-js";
import {
  ELEMENTAL_TUNING_OFFSET,
  useEventContext,
  usePlayerContext,
} from "./Chessboard";
import { CardDescription } from "./CardDescription";

export interface InteractiveProps {
  id: number;
  class?: string;
  definitionId: number;
  children: JSX.Element;
}

export function Interactive(props: InteractiveProps) {
  const { allClickable, allSelected, onClick, setPrepareTuning } =
    usePlayerContext();
  const { focusing } = useEventContext();
  const selected = () => allSelected.includes(props.id);
  const clickable = () => allClickable.includes(props.id);
  const focused = () => focusing() === props.id;
  const draggable = () =>
    allClickable.includes(props.id + ELEMENTAL_TUNING_OFFSET);
  const dragStart = (e: DragEvent) => {
    e.dataTransfer!.setData("text/plain", props.id.toString());
    setPrepareTuning(true);
  };
  const dragEnd = () => {
    setPrepareTuning(false);
  };

  return (
    <div
      class={`relative group ${props.class}`}
      classList={{
        selected: selected(),
        clickable: clickable(),
        focused: focused(),
      }}
      onClick={() => clickable() && onClick(props.id)}
      draggable={draggable()}
      onDragStart={dragStart}
      onDragEnd={dragEnd}
    >
      {props.children}
      <div class="absolute top-0 left-0 translate-y-[-100%] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all pb-2 z-30">
        <CardDescription
          definitionId={props.definitionId}
          entityId={props.id}
        />
      </div>
    </div>
  );
}
