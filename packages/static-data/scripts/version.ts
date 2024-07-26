import { characters, actionCards } from "../src/index";
import { version as packageJsonVersion } from "../package.json" with { type: "json" };

const existingVersion = Object.fromEntries(
  [...characters, ...actionCards]
    .filter((d) => d.sinceVersion)
    .map((d) => [d.shareId!, d.sinceVersion!] as const),
);

const giIndex = packageJsonVersion.indexOf("gi-");
const newVersion = "v" + packageJsonVersion.substring(giIndex + 3).replace(/-/g, ".");

let newVersionChecked = false;
function checkNewVersion() {
  if (!newVersionChecked) {
    console.log(newVersion);
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
