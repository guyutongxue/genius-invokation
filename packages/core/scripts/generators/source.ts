import ts from "typescript";
import tsdoc, {
  TSDocConfiguration,
  TSDocTagDefinition,
  TSDocParser,
  TSDocTagSyntaxKind,
} from "@microsoft/tsdoc";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BASE_PATH } from "./config";

const config = new TSDocConfiguration();
const tagDefs = [
  new TSDocTagDefinition({
    tagName: "@id",
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: "@name",
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: "@description",
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
  new TSDocTagDefinition({
    tagName: "@outdated",
    syntaxKind: TSDocTagSyntaxKind.BlockTag,
  }),
];
config.addTagDefinitions(tagDefs);
config.setSupportForTags(tagDefs, true);
const parser = new TSDocParser(config);

// 并非标准实现；将软回车视为硬回车
function printNode(node: tsdoc.DocNode): string {
  switch (node.kind) {
    case tsdoc.DocNodeKind.Section: {
      const n = node as tsdoc.DocSection;
      return n.nodes.map(printNode).join("");
    }
    case tsdoc.DocNodeKind.Paragraph: {
      const n = node as tsdoc.DocParagraph;
      return n.nodes.map(printNode).join("");
    }
    case tsdoc.DocNodeKind.PlainText: {
      const n = node as tsdoc.DocPlainText;
      return n.text;
    }
    case tsdoc.DocNodeKind.SoftBreak: {
      const n = node as tsdoc.DocSoftBreak;
      return "\n";
    }
    default:
      throw new Error(`Unsupported node kind ${node.kind}`);
  }
}

interface CommentInfo {
  range: {
    pos: number;
    end: number;
  };
  id: number;
  name: string;
  description: string;
}

async function getExistsComments(path: string): Promise<CommentInfo[]> {
  const content = await readFile(path, "utf-8");
  const file = ts.createSourceFile(path, content, ts.ScriptTarget.Latest);
  const result: CommentInfo[] = [];

  for (const node of file.statements) {
    if (node.kind !== ts.SyntaxKind.VariableStatement) {
      continue;
    }
    const comments = ts.getLeadingCommentRanges(content, node.pos);
    if (typeof comments === "undefined") {
      continue;
    }
    const docComments = comments.filter(
      (c) => c.kind === ts.SyntaxKind.MultiLineCommentTrivia,
    );
    if (docComments.length === 0) {
      continue;
    }
    const range = docComments[docComments.length - 1];
    const text = content.substring(range.pos, range.end);
    const parseCtx = parser.parseString(text);
    if (parseCtx.log.messages.length > 0) {
      throw new Error("Syntax error: " + parseCtx.log.messages[0].text);
    }
    const blocks = parseCtx.docComment.customBlocks;
    let id: number | null = null;
    let name: string | null = null;
    let description: string | null = null;
    let outdated: string | null = null;
    for (const block of blocks) {
      switch (block.blockTag.tagNameWithUpperCase) {
        case "@ID": {
          id = parseInt(printNode(block.content).trim());
          if (Number.isNaN(id)) {
            throw new Error("Invalid ID format");
          }
          break;
        }
        case "@NAME": {
          name = printNode(block.content).trim();
          break;
        }
        case "@DESCRIPTION": {
          description = printNode(block.content).trim();
          break;
        }
        case "@OUTDATED": {
          outdated = printNode(block.content).trim();
          break;
        }
      }
    }
    if (id === null || name === null || description === null) {
      console.warn(`${path} (${range.pos}) has incomplete documentation`);
      continue;
    }
    if (outdated !== null) {
      description = outdated;
    }
    result.push({ range, id, name, description });
  }
  return result;
}

export interface SourceInfo {
  id: number;
  name: string;
  description: string;
  code: string;
}

function replaceBetween(
  origin: string,
  startIndex: number,
  endIndex: number,
  insertion: string,
) {
  return (
    origin.substring(0, startIndex) + insertion + origin.substring(endIndex)
  );
}

function writeDescriptionAsComment(description: string) {
  return description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => !!l)
    .join("\n * ");
}

function sameArray<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function sameDescription(a: string, b: string) {
  const aArr = a.split("\n").map((l) => l.trim()).filter((l) => !!l);
  const bArr = b.split("\n").map((l) => l.trim()).filter((l) => !!l);
  return sameArray(aArr, bArr);
}

export async function writeSourceCode(
  filepath: string,
  init: string,
  infos: SourceInfo[],
): Promise<void> {
  filepath = path.resolve(BASE_PATH, filepath);
  await mkdir(path.dirname(filepath), { recursive: true });

  let newInfos = [];
  let resultText = init;
  if (existsSync(filepath)) {
    const existsComments = await getExistsComments(filepath);
    const rewriteInfos: (CommentInfo & { newDescription: string })[] = [];
    for (const item of infos) {
      const cmt = existsComments.find((c) => c.id === item.id);
      if (cmt) {
        if (!sameDescription(cmt.description, item.description)) {
          rewriteInfos.push({ ...cmt, newDescription: item.description });
        }
      } else {
        newInfos.push(item);
      }
    }
    resultText = await readFile(filepath, "utf-8");
    let offset = 0;
    for (const item of rewriteInfos) {
      const newComment = `/**
 * @id ${item.id}
 * @name ${item.name}
 * @description
 * ${writeDescriptionAsComment(item.newDescription)}
 * @outdated
 * ${writeDescriptionAsComment(item.description)}
 */`;
      resultText = replaceBetween(
        resultText,
        item.range.pos + offset,
        item.range.end + offset,
        newComment,
      );
      offset += newComment.length - (item.range.end - item.range.pos);
    }
  } else {
    newInfos = infos;
  }
  resultText +=
    "\n" +
    newInfos
      .map(
        (item) => `/**
 * @id ${item.id}
 * @name ${item.name}
 * @description
 * ${writeDescriptionAsComment(item.description)}
 */
${item.code}
`,
      )
      .join("\n");
  await writeFile(filepath, resultText, "utf-8");
}
