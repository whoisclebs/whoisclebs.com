export type MarkdownBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language: string; code: string };

export function parseFrontmatter(raw: string): { metadata: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error("Markdown must start with frontmatter");
  }

  const [, frontmatterRaw, body] = match;
  const entries = frontmatterRaw.split("\n").map((line) => {
    const separatorIndex = line.indexOf(":");
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    return [key, value] as const;
  });

  return { metadata: Object.fromEntries(entries), body };
}

function pushParagraph(blocks: MarkdownBlock[], lines: string[]) {
  if (lines.length === 0) return;
  blocks.push({ type: "paragraph", text: lines.join(" ").trim() });
  lines.length = 0;
}

export function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const paragraphLines: string[] = [];
  const lines = markdown.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      pushParagraph(blocks, paragraphLines);
      const language = trimmed.replace("```", "").trim() || "text";
      const codeLines: string[] = [];

      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    if (trimmed.startsWith("## ")) {
      pushParagraph(blocks, paragraphLines);
      blocks.push({ type: "heading", text: trimmed.replace(/^##\s+/, "") });
      continue;
    }

    if (trimmed.startsWith("- ")) {
      pushParagraph(blocks, paragraphLines);
      const items = [trimmed.replace(/^-\s+/, "")];

      while (index + 1 < lines.length && lines[index + 1].trim().startsWith("- ")) {
        index += 1;
        items.push(lines[index].trim().replace(/^-\s+/, ""));
      }

      blocks.push({ type: "list", items });
      continue;
    }

    if (trimmed === "") {
      pushParagraph(blocks, paragraphLines);
      continue;
    }

    paragraphLines.push(trimmed);
  }

  pushParagraph(blocks, paragraphLines);
  return blocks;
}
