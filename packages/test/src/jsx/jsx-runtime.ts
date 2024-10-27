export function jsx(...args: any[]) {
  console.log(args);
}
export { jsx as jsxDEV };

export declare namespace JSX {
  interface IntrinsicElements {
    div: any
  }
}
