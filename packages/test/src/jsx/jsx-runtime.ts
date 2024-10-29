export function jsx(...args: any[]) {
  console.log(args);
}
export function Fragment(...args: any[]) {
  console.log(args);
};
export { jsx as jsxDEV };

export declare namespace JSX {
  interface IntrinsicElements {
  }
  interface ElementChildrenAttribute {
    children: unknown;
  }
  type Element = { readonly _element: unique symbol };
  type ElementClass = unknown;
}
