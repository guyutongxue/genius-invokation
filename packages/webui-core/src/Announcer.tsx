import { DamageData, ExposedMutation, Reaction, StateData } from "@gi-tcg/typings";
import { ComponentProps, For, createEffect, splitProps, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { usePlayerContext } from "./Chessboard";

export interface AnnouncerProps extends ComponentProps<"div"> {
  stateData: StateData;
  mutations?: readonly ExposedMutation[];
  who: 0 | 1;
}

export function Announcer(props: AnnouncerProps) {
  const { assetAltText } = usePlayerContext();
  const [local, restProps] = splitProps(props, [
    "stateData",
    "mutations",
    "who",
  ]);
  const [mutationHintTexts, setMutationHintTexts] = createStore<string[]>([]);
  let scrollRef: HTMLDivElement | null = null;
  const getSpells = () => local.mutations?.map((m) => spellMutation(m,local.who, local.stateData, assetAltText));
  createEffect(() => {
    if(local.mutations === undefined) return;
    const newSpells = untrack(getSpells);
    newSpells && setMutationHintTexts((txts) => {
      const availableSpells = newSpells.filter((s) => s !== "");
      return [...txts, ...availableSpells];
    });
  });
  createEffect(() => {
    if(scrollRef && mutationHintTexts.length > 0) {
      scrollRef.scrollTo(0, scrollRef.scrollHeight + 40);
    }
  });
  return <div
    {...restProps}
    id='debug-announcer'
    ref={(el) => {scrollRef = el;}}
  >
    喋喋不休的解说员：
    <ul>
      <For each={mutationHintTexts}>
        {(txt) => <li>{txt}</li>}
      </For>
    </ul>
  </div>;
}

const spellMutation = (m: ExposedMutation, who: 0 | 1, stateData: StateData, altTextFunc: (definitionId: number) => string | undefined) => {
  let spell = "";
  const spellWho = (argWho: 0 | 1) => argWho === who ? '我方' : '对方';
  const spellEntity = (entityId: number) => {
    let spell = '';
    for (const who of [0, 1] as const) {
      const player = stateData.players[who];
      for (const ch of player.characters) {
        if (ch.id === entityId){
          spell = `${spellWho(who)} 的 ${altTextFunc(ch.definitionId)}`;
        } else {
          const entity = ch.entities.find((e) => e.id === entityId);
          if(entity) {
            spell = `${spellWho(who)} 的 ${altTextFunc(ch.definitionId)} 的 ${altTextFunc(entity.definitionId)}`;
          }
        }
      }
      for (const key of ["combatStatuses", "summons", "supports"] as const) {
        const entity = player[key].find((e) => e.id === entityId);
        if (entity) {
          const spellKeyDict = {
            combatStatuses: '出战状态',
            summons: '召唤物',
            supports: '支援牌',
          };
          spell = `${spellWho(who)} 的 ${spellKeyDict[key]} ${altTextFunc(entity.definitionId)}`;
        }
      }
    }
    if(spell === '') spell = `不知道啥`;

    return spell;
  };
  const spellCreateCardTarget = (target: string) => {
    // TODO: 目前没有给对手创建牌的情况, 未来可能会有
    switch (target) {
      case "hands":
        return '手牌';
      case "piles":
        return '牌堆';
      default:
        return '不知道哪';
    }
  };
  const typeSpellArray = [
    '物理', '冰', '水', '火', '雷', '风', '岩', '草', '穿刺', '治疗'
  ];
  const spellReactionType = (reactionType: Reaction) => {
    const reactionTypeDict: { [key in Reaction]: string} = {
      [Reaction.Melt]: "融化",
      [Reaction.Vaporize]: "蒸发",
      [Reaction.Overloaded]: "超载",
      [Reaction.Superconduct]: "超导",
      [Reaction.ElectroCharged]: "感电",
      [Reaction.Frozen]: "冻结",
      [Reaction.SwirlCryo]: "扩散冰",
      [Reaction.SwirlHydro]: "扩散水",
      [Reaction.SwirlPyro]: "扩散火",
      [Reaction.SwirlElectro]: "扩散雷",
      [Reaction.CrystallizeCryo]: "冰结晶",
      [Reaction.CrystallizeHydro]: "水结晶",
      [Reaction.CrystallizePyro]: "火结晶",
      [Reaction.CrystallizeElectro]: "雷结晶",
      [Reaction.Burning]: "燃烧",
      [Reaction.Bloom]: "绽放",
      [Reaction.Quicken]: "激化"
    };
    return reactionTypeDict[reactionType];
  };
  switch (m.type) {
    case "useCommonSkill":
      spell = `${spellWho(m.who)} 使用 ${altTextFunc(m.skill) ?? m.skill}`;
      break;
    case "damage":
      spell = `${spellEntity(m.damage.target)} 受到 ${m.damage.value} 点 \
        ${typeSpellArray[m.damage.type]} ${m.damage.type === 9 ? '' : '伤害'}`;
      break;
    case "stepRound":
      spell = `回合开始`;
      break;
    case "changePhase":
      spell = `进入 ${m.newPhase} 阶段`;
      break;
    case "oppAction":
      spell = `等待对面行动`;
      break;
    case "oppChoosingActive":
      spell = `等待对面选定出战角色`;
      break;
    case "triggered":
      spell = `${spellEntity(m.id)} 触发了`;
      break;
    case "resetDice": // 骰子变化
      spell = `${spellWho(m.who)} 现在有 ${m.value.length} 个骰子`;
      break;
    case "switchTurn":
      spell = `切换行动方`;
      break;
    case "switchActive":
      spell = `${spellWho(m.who)} 切换出战角色至 ${altTextFunc(m.definitionId)}`;
      break;
    case "setPlayerFlag":
      if(m.flagName === "declaredEnd") {
        spell = `${spellWho(m.who)} 宣布结束回合`;
      } else if(m.flagName === "legendUsed") {
        spell = `${spellWho(m.who)} 使用了秘传技能`;
      }
      break;
    case "createCard":
      // 跳过开局发牌的解说
      if (stateData.phase === "initHands") break;
      spell = `${spellWho(m.who)} 将一张卡牌置入了 ${spellCreateCardTarget(m.target)}`;
      break;
    case "removeCard":
      switch(m.reason) {
        case 'disposed':
          spell = `${spellWho(m.who)} 弃置了一张卡牌`;
          break;
        case 'elementalTuning':
          spell = `${spellWho(m.who)} 调和了 一张卡牌`;
          break;
        case 'overflow':
          spell = `${spellWho(m.who)} 手牌已满 弃置了一张卡牌`;
          break;
        case 'disabled':
          spell = `${spellWho(m.who)} 被裁了 一张卡牌`;
          break;
        // 如果是使用牌的情况, 应当会在useCommonSkill中解说
        case 'play':
          break;
      }
      break;
    case "transferCard":
      if (stateData.phase === "initHands") break;
      if(m.from === 'piles' && m.to === 'hands') {
        spell = `${spellWho(m.who)} 抽了一张卡`;
      } else if(m.from === 'hands' && m.to === 'piles') {
        spell = `${spellWho(m.who)} 埋了一张卡进牌堆`;
      } else {
        spell = `${spellWho(m.who)} 将一张卡牌从 ${spellCreateCardTarget(m.from)} 移动到 ${spellCreateCardTarget(m.to)}`;
      }
      break;
    case "createCharacter":
      if (stateData.phase === "initHands") break;
      spell = `${spellWho(m.who)} 召唤了 ${altTextFunc(m.definitionId)}`;
      break;
    case "createEntity":
      spell = `${spellEntity(m.id)} 创建了`;
      break;
    case "removeEntity":
      spell = `${altTextFunc(m.definitionId)} 移除了`;
      break;
    case "elementalReaction":
      spell = `${spellEntity(m.on)} 触发了元素反应 ${spellReactionType(m.reactionType)}`;
      break;
    // 变更实体的属性, 预计需要额外处理, 不然会废话太多
    case "modifyEntityVar":
      console.log(`===== modifyEntityVar  =====`);
      break;
    default:
      console.log(`===== 2200 unimply type: ${m.type} =====`);
      break;
  }
  return spell;
};
