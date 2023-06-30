const ENTITY_ID_BEGIN = 5.6e7;

let nextEntityId = ENTITY_ID_BEGIN;
function newEntityId(): number {
  return nextEntityId++;
}

export class Entity {
  protected readonly entityId: number;
  constructor(protected readonly id: number) {
    this.entityId = newEntityId();
  }
}

// 浅拷贝（只克隆一层）
// 因此，需要调用所有成员的 clone 方法
// 如果有基类的话同理！
export function shallowClone<T extends object>(obj: T): T {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}
