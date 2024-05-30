import { GameState } from "..";
import {
  EventArgOf,
  EventNames,
  SkillDescription,
  TriggeredSkillDefinition,
} from "../base/skill";
import { SkillContext } from "./context";
import { registerExtension, registerSkill } from "./registry";
import {
  SkillFilter,
  SkillOperation,
  TriggeredSkillBuilder,
  WritableMetaOf,
  enableShortcut,
} from "./skill";
import { ExtensionHandle } from "./type";

type BuilderMetaOfExtension<
  ExtStateType extends object,
  Event extends EventNames,
> = {
  callerType: "character";
  callerVars: never;
  eventArgType: EventArgOf<Event>;
  associatedExtension: ExtensionHandle<ExtStateType>;
};

export class ExtensionBuilder<ExtStateType extends object> {
  private static nextId = 5000001;
  private _skillNo = 0;
  private _skillList: TriggeredSkillDefinition[] = [];
  public readonly id = ExtensionBuilder.nextId++;

  constructor(private readonly initialState: ExtStateType) {}

  private generateSkillId() {
    const thisSkillNo = ++this._skillNo;
    return this.id + thisSkillNo / 100;
  }

  addTrigger<E extends EventNames>(
    event: E,
    operation: SkillOperation<BuilderMetaOfExtension<ExtStateType, E>>,
  ) {
    const action: SkillDescription<any> = (state, skillInfo, arg) => {
      const ctx = new SkillContext<
        WritableMetaOf<BuilderMetaOfExtension<ExtStateType, E>>
      >(
        state,
        {
          ...skillInfo,
          associatedExtensionId: this.id,
        },
        arg,
      );
      operation(ctx, ctx.eventArg);
      return [ctx.state, ctx.events] as const;
    };
    const def: TriggeredSkillDefinition = {
      __definition: "skills",
      type: "skill",
      skillType: null,
      id: this.generateSkillId(),
      triggerOn: event,
      requiredCost: [],
      gainEnergy: false,
      filter: () => true,
      action,
      usagePerRoundVariableName: null,
    };
    registerSkill(def);
    this._skillList.push(def);
    return this;
  }

  done(): ExtensionHandle<ExtStateType> {
    registerExtension({
      __definition: "extensions",
      type: "extension",
      id: this.id,
      initialState: this.initialState,
      skills: this._skillList,
    });
    return this.id as ExtensionHandle<ExtStateType>;
  }
}

export function extension<ExtStateType extends object>(
  initialState: ExtStateType,
) {
  return new ExtensionBuilder(initialState);
}

export const skillCountOfRoundExtension = (skillId?: number) => {
  return extension({ count: [0, 0] as [number, number] })
    .addTrigger("onAction", (c, e) => {
      if (e.isUseSkill()) {
        if (
          typeof skillId === "undefined" ||
          e.action.skill.definition.id === skillId
        ) {
          c.setExtensionState((st) => st.count[e.who]++);
        }
      }
    })
    .addTrigger("onRoundBegin", (c, e) => {
      c.setExtensionState((st) => (st.count = [0, 0]));
    })
    .done();
};
