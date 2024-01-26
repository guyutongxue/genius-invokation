const BLOCK_WORDS = [
  /64/i,
  /89/i,
  /c4/i,
  /cag/i,
  /gay/i,
  /hjt/i,
  /jzm/i,
  /ntr/i,
  /pcp/i,
  /rbq/i,
  /xjp/i,
];

export function decode(src: string) {
  const arr = Array.from(atob(src), (c) => c.codePointAt(0)!);
  if (arr.length !== 51) {
    throw new Error("Invalid input");
  }
  const last = arr.pop()!;
  const reordered = [
    ...Array.from({ length: 25 }, (_, i) => (arr[2 * i] - last) & 0xff),
    ...Array.from({ length: 25 }, (_, i) => (arr[2 * i + 1] - last) & 0xff),
    0,
  ];
  const result = Array.from({ length: 17 }).flatMap((_, i) => [
    (reordered[i * 3] << 4) + (reordered[i * 3 + 1] >> 4),
    ((reordered[i * 3 + 1] & 0xf) << 8) + reordered[i * 3 + 2],
  ]);
  result.pop();
  return result;
}

export function encode(arr: readonly number[]) {
  const padded = [...arr, 0];
  const reordered = Array.from({ length: 17 }).flatMap((_, i) => [
    padded[i * 2] >> 4,
    ((padded[i * 2] & 0xf) << 4) + (padded[i * 2 + 1] >> 8),
    arr[i * 2 + 1] & 0xff,
  ]);
  for (let last = 0; last < 0xff; last++) {
    const original = Array.from({ length: 25 }).flatMap((_, i) => [
      (reordered[i] + last) & 0xff,
      (reordered[i + 25] + last) & 0xff,
    ]);
    const encoded = btoa(String.fromCodePoint(...original, last));
    if (BLOCK_WORDS.every((word) => !word.test(encoded))) {
      return encoded;
    }
  }
  throw new Error("Not found");
}
