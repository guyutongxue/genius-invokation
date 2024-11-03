export function jsx(comp: Function, prop: Record<string, any>) {
  return comp(prop);
}
export function Fragment(...args: any[]) {
  throw new Error("Fragment should not be used");
};
export { jsx as jsxDEV };

export declare namespace JSX {
  interface IntrinsicElements {
  }
  interface ElementChildrenAttribute {
    children: unknown;
  }
  type Element = {
    readonly comp: Function;
    readonly prop: Record<string, any>;
  };
  type ElementClass = unknown;
}
