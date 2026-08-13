import type { ReactNode } from "react";

export function parseInlineFormatting(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const bold = remaining.match(/^\*\*(.+?)\*\*/);
    if (bold) {
      nodes.push(<strong key={key++}>{bold[1]}</strong>);
      remaining = remaining.slice(bold[0].length);
      continue;
    }

    const underline = remaining.match(/^__(.+?)__/);
    if (underline) {
      nodes.push(<u key={key++}>{underline[1]}</u>);
      remaining = remaining.slice(underline[0].length);
      continue;
    }

    const italic = remaining.match(/^\*(.+?)\*/);
    if (italic) {
      nodes.push(<em key={key++}>{italic[1]}</em>);
      remaining = remaining.slice(italic[0].length);
      continue;
    }

    const color = remaining.match(/^\{\{color:(.+?)\}\}/);
    if (color) {
      nodes.push(
        <span key={key++} className="text-[oklch(0.55_0.22_25)]">
          {color[1]}
        </span>
      );
      remaining = remaining.slice(color[0].length);
      continue;
    }

    const letterSpacing = remaining.match(/^\{\{ls:([^:]+):(.+?)\}\}/);
    if (letterSpacing) {
      nodes.push(
        <span key={key++} style={{ letterSpacing: letterSpacing[1] }}>
          {letterSpacing[2]}
        </span>
      );
      remaining = remaining.slice(letterSpacing[0].length);
      continue;
    }

    nodes.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return nodes;
}

export function PoemInlineText({ text }: { text: string }) {
  return <>{parseInlineFormatting(text)}</>;
}
