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

export async function copyToClipboard(content: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(content);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
