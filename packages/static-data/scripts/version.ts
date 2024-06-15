import { characters, actionCards } from "../src/index";
const existingVersion = Object.fromEntries(
  [...characters, ...actionCards]
    .filter((d) => d.sinceVersion)
    .map((d) => [d.shareId!, d.sinceVersion!] as const),
);

const newVersion = "4.8.0";

let newVersionChecked = false;
function checkNewVersion() {
  if (!newVersionChecked) {
    if (Object.values(existingVersion).includes(newVersion)) {
      throw new Error(
        "New version already exists, you may forget to update newVersion!",
      );
    }
    newVersionChecked = true;
  }
}

export function getVersion(shareId: number | undefined): string | undefined {
  if (typeof shareId === "undefined") {
    return;
  }
  if (shareId in existingVersion) {
    return existingVersion[shareId];
  }
  checkNewVersion();
  return newVersion;
}
