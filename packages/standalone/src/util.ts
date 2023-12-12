import mitt, { Emitter, EventHandlerMap, EventType, Handler } from 'mitt';

// https://github.com/developit/mitt/issues/136#issuecomment-1225190170
export function mittWithOnce<Events extends Record<EventType, unknown>>(all?: EventHandlerMap<Events>) {
  const inst = mitt(all);
  // @ts-expect-error
  inst.once = (type, fn) => {
    inst.on(type, fn);
    inst.on(type, inst.off.bind(inst, type, fn));
  };
  return inst as unknown as {
    once<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
  } & Emitter<Events>;
}
