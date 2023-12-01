import { Ref, ref } from "vue";

const imageList: Promise<Record<string, string>> = fetch(
  `/assets/index.json`,
).then((r) => r.json());

const cachedImages = new Map<number, Ref<string | undefined>>();

export function requestLoad(id: number): Ref<string | undefined> {
  if (!cachedImages.has(id)) {
    const result = ref<string>();
    cachedImages.set(id, result);
    imageList.then((images) => {
      const path = images[id];
      if (path) {
        fetch(`/assets/${path}.webp`)
          .then((r) => r.blob())
          .then((blob) => {
            result.value = URL.createObjectURL(blob);
          });
      }
    });
  }
  return cachedImages.get(id)!;
}
