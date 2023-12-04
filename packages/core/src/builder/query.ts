import { StrictlyTypedCharacterContext } from "./context";
import { ExEntityType } from "./type";



/**
 * 在指定某个角色目标时，可传入的参数类型：
 * - Query Lambda 形如 `$ => $.active()`
 *   - 该 Lambda 可返回 `QueryBuilder` 如上；
 *   - 也可返回具体的对象上下文，如 `$ => $.opp().one()`。
 * - 直接传入具体的对象上下文。
 */
export type TargetQueryArg<
  Readonly extends boolean,
  Ext extends object,
  CallerType extends ExEntityType,
> =
  | StrictlyTypedCharacterContext<Readonly>[]
  | StrictlyTypedCharacterContext<Readonly>
  | ((
      $: StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, ExEntityType>,
    ) =>
      | StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, "character">
      | StrictlyTypedQueryBuilder<Readonly, Ext, CallerType, ExEntityType>
      | StrictlyTypedCharacterContext<Readonly>[]
      | StrictlyTypedCharacterContext<Readonly>);


function query(s: string) {
  
}
