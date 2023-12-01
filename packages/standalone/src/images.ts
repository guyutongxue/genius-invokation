import { Ref, ref } from "vue";

const imageList: Promise<Record<string, string>> = fetch(
  `/assets/index.json`,
).then((r) => r.json());

const cachedImages = new Map<number, Ref<string>>();

export function requestLoad(id: number): Ref<string | undefined> {
  if (!cachedImages.has(id)) {
    const result = ref();
    cachedImages.set(id, result);
    imageList.then((images) => {
      const path = images[id];
      if (path) {
        fetch(`/assets/${path}.webp`)
          .then((r) => r.arrayBuffer())
          .then((blob) => {
            result.value =
              "data:image/webp;base64," +
              btoa(String.fromCharCode(...new Uint8Array(blob)));
          });
      }
    });
  }
  return cachedImages.get(id)!;
}
