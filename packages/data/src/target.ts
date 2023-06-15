export const Target = {
  // 阵营（0~2 位）
  UNDEFINED: 0b00,     // 未定义，由 Context 给出
  ME: 0b01,            // 我方
  OPP: 0b10,           // 对方
  // ALL_PLAYER: 0b11, // 全体

  // 角色位置（3~5 位）
  ACTIVE: 0b000 << 2,  // 出战角色
  NEXT: 0b001 << 2,    // 下一位角色
  PREV: 0b010 << 2,    // 上一位角色
  STANDBY: 0b011 << 2, // 后台角色
  ALL: 0b111 << 2,     // 全体角色

  // 特殊条件（6~8 位）
  // 0b000 << 5,              // 无特殊条件
  _M_OF_OBJ_ID: 0b100 << 5,   // 指定 objectId 的角色
  _M_WITH_STATUS: 0b010 << 5, // 拥有指定 objectId 状态的角色
  NEARBY: 0b001 << 5,         // 附近的对方角色

  WITH_STATUS(id: number) {
    // 拥有指定状态的角色 e.g. WITH_STATUS(117031)
    return Target._M_WITH_STATUS | (id << 8) | Target.ALL;
  },
  OF_OBJ_ID(id: number) {
    // 指定id的角色 e.g. OF_OBJ_ID(117031)
    return Target._M_OF_OBJ_ID | (id << 8) | Target.ALL | Target.ME;
  },

  isMine(target: number) {
    return (target & Target.ME) !== 0;
  }
} as const;
