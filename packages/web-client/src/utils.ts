export async function getGravatarUrl(email: string, size = 80) {
  email = email.toLocaleLowerCase();
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email),
  );
  const hex = Array.from(new Uint8Array(digest))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
  return `https://www.gravatar.com/avatar/${hex}?d=identicon&s=${size}`;
}
