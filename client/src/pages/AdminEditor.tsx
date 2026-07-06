import { useState, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdmin } from "@/hooks/useAdmin";
import { ArrowLeft, Plus, Trash2, Edit3, GripVertical, Bold, Italic, Underline, IndentIncrease, IndentDecrease, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ===== Rich content format =====
// Content is stored as plain text with conventions:
// - Each line = one line of poem
// - "＜" at start of line = stanza break (empty line visually)
// - "　" (full-width space) at start = indent level (each 　 = 1 level)
// - Inline formatting: **bold**, *italic*, __underline__, {{color:text}}, {{ls:0.1em:text}}

function EditorToolbar({
  onBold,
  onItalic,
  onUnderline,
  onIndent,
  onOutdent,
  onStanzaBreak,
  onColor,
  onLetterSpacing,
}: {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onStanzaBreak: () => void;
  onColor: () => void;
  onLetterSpacing: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-black/10 bg-black/[0.02]">
      <button onClick={onBold} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors" title="굵게">
        <Bold size={14} />
      </button>
      <button onClick={onItalic} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors" title="기울임">
        <Italic size={14} />
      </button>
      <button onClick={onUnderline} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors" title="밑줄">
        <Underline size={14} />
      </button>
      <div className="w-px h-4 bg-black/10 mx-1" />
      <button onClick={onIndent} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors" title="들여쓰기 +">
        <IndentIncrease size={14} />
      </button>
      <button onClick={onOutdent} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors" title="들여쓰기 -">
        <IndentDecrease size={14} />
      </button>
      <button onClick={onStanzaBreak} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors" title="연 구분">
        <Minus size={14} />
      </button>
      <div className="w-px h-4 bg-black/10 mx-1" />
      <button onClick={onColor} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors text-[10px] font-bold" title="색상 강조">
        <span className="text-[oklch(0.55_0.22_25)]">A</span>
      </button>
      <button onClick={onLetterSpacing} className="p-1.5 hover:bg-black/5 rounded text-black/60 hover:text-black transition-colors text-[10px] font-bold" title="자간 조절">
        <span>LS</span>
      </button>
    </div>
  );
}

function ContentPreview({ content, type }: { content: string; type: "poem" | "essay" }) {
  const rendered = useMemo(() => {
    if (!content) return null;
    const lines = content.split("\n");

    return lines.map((line, i) => {
      // ＜ or < as standalone line - render as independent line (same as WorkPage)
      if (line.trim() === "＜" || line.trim() === "<") {
        return (
          <div key={i} className="book-line">
            {line.trim()}
          </div>
        );
      }

      // Empty line = stanza break (visual gap)
      if (!line.trim()) {
        return <div key={i} className="stanza-gap" />;
      }

      // Count indent level: full-width spaces (editor format) or regular spaces (legacy format)
      let indent = 0;
      let text = line;
      // Full-width space indent (editor format)
      while (text.startsWith("　")) {
        indent++;
        text = text.slice(1);
      }
      // Regular space indent (legacy format from existing works)
      if (indent === 0) {
        const leadingSpaces = text.match(/^(\s*)/)?.[1]?.length || 0;
        indent = Math.floor(leadingSpaces / 2);
        if (indent > 0) text = text.trimStart();
      }

      // Parse inline formatting
      const formatted = parseInlineFormatting(text);

      return (
        <div
          key={i}
          className="book-line"
          style={indent > 0 ? { paddingLeft: `${indent}em` } : undefined}
        >
          {formatted}
        </div>
      );
    });
  }, [content, type]);

  return (
    <div className={type === "poem" ? "book-body-text" : "essay-content"}>
      {rendered}
    </div>
  );
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      nodes.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^\*(.+?)\*/);
    if (italicMatch) {
      nodes.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Underline: __text__
    const underlineMatch = remaining.match(/^__(.+?)__/);
    if (underlineMatch) {
      nodes.push(<u key={key++}>{underlineMatch[1]}</u>);
      remaining = remaining.slice(underlineMatch[0].length);
      continue;
    }

    // Color: {{color:text}}
    const colorMatch = remaining.match(/^\{\{color:(.+?)\}\}/);
    if (colorMatch) {
      nodes.push(
        <span key={key++} className="text-[oklch(0.55_0.22_25)]">
          {colorMatch[1]}
        </span>
      );
      remaining = remaining.slice(colorMatch[0].length);
      continue;
    }

    // Letter spacing: {{ls:value:text}}
    const lsMatch = remaining.match(/^\{\{ls:([^:]+):(.+?)\}\}/);
    if (lsMatch) {
      nodes.push(
        <span key={key++} style={{ letterSpacing: lsMatch[1] }}>
          {lsMatch[2]}
        </span>
      );
      remaining = remaining.slice(lsMatch[0].length);
      continue;
    }

    // Plain character
    nodes.push(remaining[0]);
    remaining = remaining.slice(1);
  }

  return nodes;
}

// ===== Main Editor Component =====
export default function AdminEditor() {
  const { isAdmin } = useAdmin();
  const [, navigate] = useLocation();
  const { data: authors } = trpc.authors.list.useQuery();
  const { data: allWorks, refetch: refetchWorks } = trpc.admin.listAllWorks.useQuery(undefined, { enabled: isAdmin });

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [authorId, setAuthorId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"poem" | "essay">("poem");
  const [content, setContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const createMutation = trpc.admin.createWork.useMutation({
    onSuccess: () => {
      toast.success("작품이 등록되었습니다.");
      resetForm();
      refetchWorks();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateWork.useMutation({
    onSuccess: () => {
      toast.success("작품이 수정되었습니다.");
      resetForm();
      refetchWorks();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteWork.useMutation({
    onSuccess: () => {
      toast.success("작품이 삭제되었습니다.");
      refetchWorks();
    },
    onError: (err) => toast.error(err.message),
  });

  const sortMutation = trpc.admin.updateSortOrder.useMutation({
    onSuccess: () => refetchWorks(),
  });

  const resetForm = () => {
    setEditingId(null);
    setAuthorId("");
    setTitle("");
    setType("poem");
    setContent("");
    setShowEditor(false);
  };

  const handleEdit = (work: NonNullable<typeof allWorks>[number]) => {
    setEditingId(work.id);
    setAuthorId(work.authorId);
    setTitle(work.title);
    setType(work.type as "poem" | "essay");
    setContent(""); // Will need to fetch content
    setShowEditor(true);
    // Fetch the full work content
    fetchWorkContent(work.id);
  };

  const fetchWorkContent = async (id: number) => {
    try {
      const result = await trpcUtils.works.getById.fetch({ id });
      if (result) {
        setContent(result.content);
      }
    } catch {
      toast.error("작품 내용을 불러올 수 없습니다.");
    }
  };

  const trpcUtils = trpc.useUtils();

  const handleSubmit = () => {
    if (!authorId || !title.trim() || !content.trim()) {
      toast.error("모든 필드를 입력해주세요.");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, title, type, content });
    } else {
      createMutation.mutate({ authorId: authorId as number, title, type, content });
    }
  };

  const handleDelete = (id: number, workTitle: string) => {
    if (confirm(`"${workTitle}" 작품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSortChange = (workId: number, newSort: number) => {
    sortMutation.mutate({ workId, newSortOrder: newSort });
  };

  // Textarea helpers
  const textareaRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) {
      node.addEventListener("keydown", handleKeyDown);
      return () => node.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    const textarea = e.target as HTMLTextAreaElement;
    if (e.key === "Tab") {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const lines = textarea.value.split("\n");

      // Find current line
      let charCount = 0;
      let lineIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (charCount + lines[i].length >= start) {
          lineIndex = i;
          break;
        }
        charCount += lines[i].length + 1;
      }

      if (e.shiftKey) {
        // Remove indent
        if (lines[lineIndex].startsWith("　")) {
          lines[lineIndex] = lines[lineIndex].slice(1);
        }
      } else {
        // Add indent
        lines[lineIndex] = "　" + lines[lineIndex];
      }

      const newValue = lines.join("\n");
      setContent(newValue);
    }
  };

  const insertAtCursor = (before: string, after: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#editor-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);

    const newContent = content.slice(0, start) + before + selectedText + after + content.slice(end);
    setContent(newContent);

    // Restore cursor
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  };

  const insertStanzaBreak = () => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#editor-textarea");
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const newContent = content.slice(0, pos) + "\n＜\n" + content.slice(pos);
    setContent(newContent);
  };

  const addIndent = () => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#editor-textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lines = content.split("\n");
    let charCount = 0;
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        lineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }
    lines[lineIndex] = "　" + lines[lineIndex];
    setContent(lines.join("\n"));
  };

  const removeIndent = () => {
    const textarea = document.querySelector<HTMLTextAreaElement>("#editor-textarea");
    if (!textarea) return;
    const start = textarea.selectionStart;
    const lines = content.split("\n");
    let charCount = 0;
    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= start) {
        lineIndex = i;
        break;
      }
      charCount += lines[i].length + 1;
    }
    if (lines[lineIndex].startsWith("　")) {
      lines[lineIndex] = lines[lineIndex].slice(1);
      setContent(lines.join("\n"));
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-black/40 text-sm mb-4">관리자 권한이 필요합니다.</p>
          <Link href="/">
            <span className="text-xs text-black/40 hover:text-black underline cursor-pointer">홈으로 돌아가기</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black/10 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-black/40 hover:text-black transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
            <span className="text-sm font-bold text-black">관리자 에디터</span>
          </div>
          <Button
            onClick={() => { resetForm(); setShowEditor(true); }}
            className="bg-black text-white hover:bg-black/80 text-xs h-8 rounded-none gap-1"
          >
            <Plus size={12} /> 새 작품
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Editor Panel */}
        {showEditor && (
          <section className="mb-8 border border-black/10 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-black">
                {editingId ? "작품 수정" : "새 작품 등록"}
              </h2>
              <button onClick={resetForm} className="text-xs text-black/40 hover:text-black">
                취소
              </button>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value ? Number(e.target.value) : "")}
                className="text-xs border border-black/15 px-3 py-2 bg-white focus:outline-none focus:border-black/40"
              >
                <option value="">작가 선택</option>
                {authors?.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs border border-black/15 px-3 py-2 bg-white focus:outline-none focus:border-black/40"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "poem" | "essay")}
                className="text-xs border border-black/15 px-3 py-2 bg-white focus:outline-none focus:border-black/40"
              >
                <option value="poem">시</option>
                <option value="essay">산문</option>
              </select>
            </div>

            {/* Editor + Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Editor */}
              <div className="border border-black/10">
                <EditorToolbar
                  onBold={() => insertAtCursor("**", "**")}
                  onItalic={() => insertAtCursor("*", "*")}
                  onUnderline={() => insertAtCursor("__", "__")}
                  onIndent={addIndent}
                  onOutdent={removeIndent}
                  onStanzaBreak={insertStanzaBreak}
                  onColor={() => insertAtCursor("{{color:", "}}")}
                  onLetterSpacing={() => insertAtCursor("{{ls:0.15em:", "}}")}
                />
                <textarea
                  id="editor-textarea"
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={type === "poem"
                    ? "시를 입력하세요...\n\n줄바꿈 = 행 구분\n＜ = 연 구분\n　(전각 공백) = 들여쓰기"
                    : "산문을 입력하세요..."
                  }
                  className="w-full h-64 sm:h-80 p-4 text-xs leading-relaxed font-mono resize-none focus:outline-none bg-white"
                  style={{ whiteSpace: "pre-wrap" }}
                />
              </div>

              {/* Preview */}
              <div className="border border-black/10 p-6 bg-white overflow-y-auto max-h-[400px]">
                <div className="text-[10px] text-black/30 mb-3 uppercase tracking-widest">미리보기</div>
                {content ? (
                  <ContentPreview content={content} type={type} />
                ) : (
                  <p className="text-xs text-black/20">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-black text-white hover:bg-black/80 text-xs h-8 rounded-none px-6"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "저장 중..."
                  : editingId ? "수정 완료" : "등록"
                }
              </Button>
            </div>
          </section>
        )}

        {/* Works List */}
        <section>
          <h2 className="text-sm font-bold text-black mb-4">등록된 작품 목록</h2>
          <div className="border-t border-black/10">
            {allWorks?.map((work) => (
              <div
                key={work.id}
                className="flex items-center justify-between py-3 px-2 border-b border-black/5 hover:bg-black/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <GripVertical size={12} className="text-black/20 shrink-0" />
                  <input
                    type="number"
                    value={work.sortOrder}
                    onChange={(e) => handleSortChange(work.id, Number(e.target.value))}
                    className="w-10 text-[10px] text-center border border-black/10 py-0.5 bg-white"
                  />
                  <span className="text-[10px] text-black/30 w-6 shrink-0">
                    {work.type === "poem" ? "시" : "산문"}
                  </span>
                  <span className="text-xs text-black/80 truncate">{work.title}</span>
                  <span className="text-[10px] text-black/30 shrink-0">— {work.authorName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(work)}
                    className="p-1 text-black/30 hover:text-black transition-colors"
                    title="수정"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(work.id, work.title)}
                    className="p-1 text-black/30 hover:text-[oklch(0.55_0.22_25)] transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {(!allWorks || allWorks.length === 0) && (
              <div className="py-8 text-center text-xs text-black/30">
                등록된 작품이 없습니다.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
