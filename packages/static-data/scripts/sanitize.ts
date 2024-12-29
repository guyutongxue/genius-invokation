function convertBold(str: string, removeBold?: boolean) {
  return str.replace(
    /<color=#FFD780FF>(.*?)<\/color>/gi,
    removeBold ? "$1" : "**$1**",
  );
}

function stripMarkup(str: string) {
  return str.replace(/(<([^>]+)>)/gi, "");
}

function replaceLayout(str: string) {
  return str
    .replace(/{LAYOUT_MOBILE#.*?}{LAYOUT_PC#(.*?)}{LAYOUT_PS#.*?}/gi, "$1")
    .replace("#", "")
    .replaceAll("{NON_BREAK_SPACE}", " ");
}

function removeSprite(str: string) {
  return str.replace(/{SPRITE_PRESET.*?}/gi, "");
}

function replaceNewline(str: string) {
  return str.replace(/\\n/gi, "\n");
}

export function sanitizeDescription(str: string, removeBold?: boolean) {
  return removeSprite(
    replaceNewline(replaceLayout(stripMarkup(convertBold(str, removeBold)))),
  );
}
