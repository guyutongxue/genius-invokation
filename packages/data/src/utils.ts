export type RemovePrefix<T extends string | number | Symbol> = T extends `on${infer U}`
  ? Uncapitalize<U>
  : never;
export type AddPrefix<T extends string> = `on${Capitalize<T>}`;
export function capitalize<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}
export function addPrefix<T extends string>(event: T): AddPrefix<T> {
  return `on${capitalize(event)}`;
}
