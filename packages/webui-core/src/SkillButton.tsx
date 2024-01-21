import type { SkillData } from "@gi-tcg/typings";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { usePlayerContext } from "./Chessboard";

export interface SkillButtonProps {
  data: SkillData;
}

export function SkillButton(props: SkillButtonProps) {
  const { allClickable, onClick, allCosts } = usePlayerContext();
  const clickable = () => allClickable.includes(props.data.definitionId);
  const realCost = () => allCosts[props.data.definitionId];
  return (
    <div class="flex flex-col items-center">
      <button
        type="button"
        class="w-10 h-10 rounded-999 bg-yellow-800 p-1 border-none disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700 flex items-center justify-center"
        disabled={!clickable()}
        onClick={() => clickable() && onClick(props.data.definitionId)}
      >
        <Image imageId={props.data.definitionId} class="object-contain" />
      </button>
      <DiceCost
        class="flex flex-row"
        cost={props.data.definitionCost}
        realCost={realCost()}
      />
    </div>
  );
}
