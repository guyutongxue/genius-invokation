import { JSX } from "solid-js";
import { ELEMENTAL_TUNING_OFFSET, usePlayerContext } from "./Chessboard";

export interface InteractableProps {
  id: number;
  class?: string;
  definitionId?: number;
  children: JSX.Element;
}

export function Interactable(props: InteractableProps) {
  const {
    allClickable,
    allSelected,
    onClick,
    focusing,
    onHover,
    setPrepareTuning,
  } = usePlayerContext();
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
      class={props.class}
      classList={{
        selected: selected(),
        clickable: clickable(),
        focused: focused(),
      }}
      onClick={() => clickable() && onClick(props.id)}
      onMouseEnter={() =>
        props.definitionId && onHover("enter", props.definitionId)
      }
      onMouseLeave={() =>
        props.definitionId && onHover("leave", props.definitionId)
      }
      draggable={draggable()}
      onDragStart={dragStart}
      onDragEnd={dragEnd}
    >
      {props.children}
    </div>
  );
}
