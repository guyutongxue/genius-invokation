import { createSignal, Accessor } from "solid-js";

export function createWaitNotify<T = unknown>(): [
  waiting: Accessor<boolean>,
  wait: () => Promise<T>,
  notify: (value: T) => void,
] {
  const [waiting, setWaiting] = createSignal(false);
  let resolve: (value: T) => void = () => {};
  const wait = () => {
    setWaiting(true);
    return new Promise<T>((r) => {
      resolve = r;
    });
  };
  const notify = (value: T) => {
    setWaiting(false);
    return resolve(value);
  };
  return [waiting, wait, notify];
}
