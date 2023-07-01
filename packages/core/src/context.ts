
export type ContextFactory<T> = (entityId: number) => T | null;
