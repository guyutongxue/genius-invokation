/*
  Warnings:

  - You are about to drop the column `version` on the `Game` table. All the data in the column will be lost.
  - Added the required column `coreVersion` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gameVersion` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coreVersion" TEXT NOT NULL,
    "gameVersion" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "winnerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Game" ("createdAt", "data", "id", "winnerId") SELECT "createdAt", "data", "id", "winnerId" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
