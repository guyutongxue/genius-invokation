import type { SkillData } from "@gi-tcg/typings";
import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { usePlayerContext } from "./Chessboard";
import { CardDescription } from "./CardDescription";

export interface SkillButtonProps {
  data: SkillData;
}

export function SkillButton(props: SkillButtonProps) {
  const { allClickable, onClick, allCosts } = usePlayerContext();
  const clickable = () => allClickable.includes(props.data.definitionId);
  const realCost = () => allCosts[props.data.definitionId];
  return (
    <div class="flex flex-col items-center group">
      <div class="relative">
        <button
          type="button"
          class="w-10 h-10 rounded-999 bg-yellow-800 p-1 b-none disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700 flex items-center justify-center disabled:cursor-not-allowed"
          disabled={!clickable()}
          onClick={() => clickable() && onClick(props.data.definitionId)}
        >
          <Image imageId={props.data.definitionId} class="max-w-full" />
        </button>
        <div class="absolute top-0 right-0 translate-y-[-100%] invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all pb-2 z-30">
          <CardDescription definitionId={props.data.definitionId} />
        </div>
      </div>
      <DiceCost
        class="flex flex-row"
        cost={props.data.definitionCost}
        realCost={realCost()}
      />
    </div>
  );
}
