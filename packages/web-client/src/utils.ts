export function getAvatarUrl(id: number) {
  return `https://avatars.githubusercontent.com/u/${id}?v=4`;
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

export function roomIdToCode(id: number) {
  return String(((id + 1) * 48271) % 1_000_000).padStart(6, "0");
}

export function roomCodeToId(code: string) {
  return (Number(code) * 371631 - 1) % 1_000_000;
}
