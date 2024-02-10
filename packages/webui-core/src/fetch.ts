
const cache = new Map<string, string>();
export async function cached(url: string) {
  if (cache.has(url)) {
    return cache.get(url)!;
  }
  const response = await fetch(url);
  const blob = await response.blob();
  const dataUrl = URL.createObjectURL(blob);
  cache.set(url, dataUrl);
  return dataUrl;
}
