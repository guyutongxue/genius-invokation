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
  type Element = unknown;
  type ElementClass = unknown;
}
