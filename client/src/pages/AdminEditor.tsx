import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdmin } from "@/hooks/useAdmin";
import { useComposition } from "@/hooks/useComposition";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  GripVertical,
  Bold,
  Italic,
  Underline,
  IndentIncrease,
  IndentDecrease,
  Minus,
  Search,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  BookOpen,
  Save,
  FileText,
  Moon,
  Sun,
  RotateCcw as ResetIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPoemLines, getDisplayIndentStyle, indentSelectedLines, type FormattedPoemLine } from "@/lib/poemFormatting";
import { parseInlineFormatting } from "@/components/PoemInlineText";

const DRAFT_PREFIX = "poem-editor:draft:";

type DraftPayload = {
  authorId: number | "";
  title: string;
  type: "poem" | "essay";
  content: string;
  savedAt: string;
};

function readDraft(key: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as DraftPayload : null;
  } catch {
    return null;
  }
}

function EditorToolbar({
  onBold,
  onItalic,
  onUnderline,
  onIndent,
  onOutdent,
  onStanzaBreak,
  onColor,
  onLetterSpacing,
  onUndo,
  onRedo,
}: {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onStanzaBreak: () => void;
  onColor: () => void;
  onLetterSpacing: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const buttons = [
    { label: "실행 취소", icon: <RotateCcw size={14} />, action: onUndo },
    { label: "다시 실행", icon: <RotateCw size={14} />, action: onRedo },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-current/10 bg-current/[0.025]">
      {buttons.map((button) => (
        <button key={button.label} type="button" onClick={button.action} className="p-1.5 opacity-55 hover:opacity-100 transition-opacity" title={button.label}>
          {button.icon}
        </button>
      ))}
      <div className="w-px h-4 bg-current/10 mx-1" />
      <button type="button" onClick={onBold} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity" title="굵게"><Bold size={14} /></button>
      <button type="button" onClick={onItalic} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity" title="기울임"><Italic size={14} /></button>
      <button type="button" onClick={onUnderline} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity" title="밑줄"><Underline size={14} /></button>
      <div className="w-px h-4 bg-current/10 mx-1" />
      <button type="button" onClick={onIndent} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity" title="들여쓰기 +"><IndentIncrease size={14} /></button>
      <button type="button" onClick={onOutdent} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity" title="들여쓰기 -"><IndentDecrease size={14} /></button>
      <button type="button" onClick={onStanzaBreak} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity" title="연 구분"><Minus size={14} /></button>
      <div className="w-px h-4 bg-current/10 mx-1" />
      <button type="button" onClick={onColor} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity text-[10px] font-bold" title="색상 강조"><span className="text-[oklch(0.55_0.22_25)]">A</span></button>
      <button type="button" onClick={onLetterSpacing} className="p-1.5 opacity-60 hover:opacity-100 transition-opacity text-[10px] font-bold" title="자간 조절">LS</button>
    </div>
  );
}

function ContentPreview({ content, type, fontSize, lineHeight }: { content: string; type: "poem" | "essay"; fontSize: number; lineHeight: number }) {
  const rendered = useMemo(() => {
    if (!content) return null;
    const lines = type === "poem" ? formatPoemLines(content) : content.split("\n");

    return lines.map((entry, i) => {
      if (type === "poem") {
        const line = entry as FormattedPoemLine;
        if (line.kind === "gap") return <div key={i} className="stanza-gap" />;
        return (
          <div key={i} className="book-line" style={line.kind === "line" ? getDisplayIndentStyle(line) : undefined}>
            {parseInlineFormatting(line.text)}
          </div>
        );
      }

      const line = entry as string;
      if (line.trim() === "＜" || line.trim() === "<") return <div key={i} className="book-line">{line.trim()}</div>;
      if (!line.trim()) return <div key={i} className="stanza-gap" />;

      return (
        <div key={i} className="book-line">
          {parseInlineFormatting(line)}
        </div>
      );
    });
  }, [content, type]);

  return (
    <div className={type === "poem" ? "book-body-text" : "essay-content"} style={{ fontSize: `${fontSize}px`, lineHeight }}>
      {rendered}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-black/7 last:border-b-0">
      <span className="text-[10px] text-black/40">{label}</span>
      <span className="text-xs tabular-nums text-black/70">{value}</span>
    </div>
  );
}

export default function AdminEditor() {
  const { isAdmin } = useAdmin();
  const [, navigate] = useLocation();
  const { data: authors } = trpc.authors.list.useQuery();
  const { data: allWorks, refetch: refetchWorks } = trpc.admin.listAllWorks.useQuery(undefined, { enabled: isAdmin });
  const trpcUtils = trpc.useUtils();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [authorId, setAuthorId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"poem" | "essay">("poem");
  const [content, setContent] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState("저장됨");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"paper" | "night">("paper");
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(2);
  const [editorWidth, setEditorWidth] = useState<"narrow" | "standard" | "wide">("standard");
  const [findQuery, setFindQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const draftKey = `${DRAFT_PREFIX}${editingId ?? "new"}`;
  const textareaSelector = "#editor-textarea";

  const createMutation = trpc.admin.createWork.useMutation({
    onSuccess: () => {
      toast.success("작품이 등록되었습니다.");
      localStorage.removeItem(draftKey);
      resetForm();
      refetchWorks();
    },
    onError: (error) => toast.error(error.message),
  });

  const updateMutation = trpc.admin.updateWork.useMutation({
    onSuccess: () => {
      toast.success("작품이 수정되었습니다.");
      localStorage.removeItem(draftKey);
      resetForm();
      refetchWorks();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = trpc.admin.deleteWork.useMutation({
    onSuccess: () => {
      toast.success("작품이 삭제되었습니다.");
      refetchWorks();
    },
    onError: (error) => toast.error(error.message),
  });

  const sortMutation = trpc.admin.updateSortOrder.useMutation({
    onSuccess: () => refetchWorks(),
  });

  useEffect(() => {
    if (!showEditor) return;
    setDraftAvailable(Boolean(localStorage.getItem(draftKey)));
  }, [draftKey, showEditor]);

  useEffect(() => {
    if (!showEditor || !isDirty) return;
    setSaveStatus("초안 저장 중...");
    const timer = window.setTimeout(() => {
      const payload: DraftPayload = { authorId, title, type, content, savedAt: new Date().toISOString() };
      localStorage.setItem(draftKey, JSON.stringify(payload));
      setDraftAvailable(true);
      setLastSavedAt(payload.savedAt);
      setSaveStatus("로컬 초안 저장됨");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [authorId, content, draftKey, isDirty, showEditor, title, type]);

  function updateCursorPosition(textarea: HTMLTextAreaElement) {
    const beforeCursor = textarea.value.slice(0, textarea.selectionStart);
    const lines = beforeCursor.split("\n");
    setCursorPosition({ line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 });
  }

  function markDirty() {
    setIsDirty(true);
    setSaveStatus("변경 사항 있음");
  }

  function resetForm() {
    setEditingId(null);
    setAuthorId("");
    setTitle("");
    setType("poem");
    setContent("");
    setShowEditor(false);
    setIsDirty(false);
    setSaveStatus("저장됨");
    setLastSavedAt(null);
    setFocusMode(false);
  }

  function openNewEditor() {
    setEditingId(null);
    setAuthorId("");
    setTitle("");
    setType("poem");
    setContent("");
    setIsDirty(false);
    setSaveStatus("새 초안");
    setLastSavedAt(null);
    setShowEditor(true);
  }

  async function fetchWorkContent(id: number) {
    try {
      const result = await trpcUtils.works.getById.fetch({ id });
      if (result) setContent(result.content);
    } catch {
      toast.error("작품 내용을 불러올 수 없습니다.");
    }
  }

  function handleEdit(work: NonNullable<typeof allWorks>[number]) {
    setEditingId(work.id);
    setAuthorId(work.authorId);
    setTitle(work.title);
    setType(work.type as "poem" | "essay");
    setContent("");
    setIsDirty(false);
    setSaveStatus("기존 작품 불러오는 중...");
    setShowEditor(true);
    void fetchWorkContent(work.id).then(() => setSaveStatus("저장됨"));
  }

  function restoreDraft() {
    const draft = readDraft(draftKey);
    if (!draft) return;
    setAuthorId(draft.authorId);
    setTitle(draft.title);
    setType(draft.type);
    setContent(draft.content);
    setIsDirty(true);
    setSaveStatus("초안 복구됨");
    toast.success("저장된 초안을 복구했습니다.");
  }

  function handleSubmit() {
    if (!authorId || !title.trim() || !content.trim()) {
      toast.error("작가, 제목, 내용을 모두 입력해주세요.");
      return;
    }
    setSaveStatus("서버에 저장 중...");
    if (editingId) {
      updateMutation.mutate({ id: editingId, title, type, content });
    } else {
      createMutation.mutate({ authorId: authorId as number, title, type, content });
    }
  }

  function handleDelete(id: number, workTitle: string) {
    if (confirm(`"${workTitle}" 작품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      deleteMutation.mutate({ id });
    }
  }

  function changeIndent(direction: "in" | "out") {
    const textarea = document.querySelector<HTMLTextAreaElement>(textareaSelector);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = indentSelectedLines(content, start, end, direction);
    setContent(newValue);
    markDirty();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, Math.max(start, Math.min(newValue.length, end + (direction === "in" ? 1 : -1))));
    });
  }

  function insertAtCursor(before: string, after: string) {
    const textarea = document.querySelector<HTMLTextAreaElement>(textareaSelector);
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.slice(start, end);
    const next = content.slice(0, start) + before + selectedText + after + content.slice(end);
    setContent(next);
    markDirty();
    window.setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + before.length;
      textarea.selectionEnd = start + before.length + selectedText.length;
    }, 0);
  }

  function insertStanzaBreak() {
    const textarea = document.querySelector<HTMLTextAreaElement>(textareaSelector);
    if (!textarea) return;
    const pos = textarea.selectionStart;
    setContent(content.slice(0, pos) + "\n＜\n" + content.slice(pos));
    markDirty();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const textarea = event.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = indentSelectedLines(content, start, end, event.shiftKey ? "out" : "in");
    setContent(next);
    markDirty();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, Math.max(start, Math.min(next.length, end + (event.shiftKey ? -1 : 1))));
    });
  }

  const composition = useComposition<HTMLTextAreaElement>({ onKeyDown: handleKeyDown });

  function runUndo() {
    document.execCommand("undo");
  }

  function runRedo() {
    document.execCommand("redo");
  }

  function findNext() {
    const textarea = document.querySelector<HTMLTextAreaElement>(textareaSelector);
    const needle = findQuery.trim();
    if (!textarea || !needle) return;
    const startAt = textarea.selectionEnd || 0;
    const foundAt = content.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase(), startAt);
    const index = foundAt >= 0 ? foundAt : content.toLocaleLowerCase().indexOf(needle.toLocaleLowerCase());
    if (index < 0) return toast.info("검색 결과가 없습니다.");
    textarea.focus();
    textarea.setSelectionRange(index, index + needle.length);
  }

  const wordCount = useMemo(() => content.trim() ? content.trim().split(/\s+/).length : 0, [content]);
  const characterCount = content.replace(/\n/g, "").length;
  const lineCount = content ? content.split("\n").length : 0;
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220));
  const matchCount = findQuery.trim() ? content.toLocaleLowerCase().split(findQuery.trim().toLocaleLowerCase()).length - 1 : 0;
  const currentLineText = content.split("\n")[cursorPosition.line - 1] ?? "";
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const editorWidthClass = editorWidth === "narrow" ? "max-w-[620px]" : editorWidth === "wide" ? "max-w-[900px]" : "max-w-[760px]";

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-black/40 text-sm mb-4">관리자 권한이 필요합니다.</p>
          <Link href="/"><span className="text-xs text-black/40 hover:text-black underline cursor-pointer">홈으로 돌아가기</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black">
      <header className="border-b border-black/10 bg-white px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-black/40 hover:text-black transition-colors"><ArrowLeft size={16} /></Link>
            <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)] shrink-0" />
            <span className="text-sm font-bold truncate">문학 집필 공간</span>
            <span className="hidden sm:inline text-[10px] text-black/30 border-l border-black/10 pl-3">작품을 쓰고, 다듬고, 미리보기</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => setFocusMode((value) => !value)} className="text-[11px] text-black/45 hover:text-black flex items-center gap-1 transition-colors">
              {focusMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span className="hidden sm:inline">{focusMode ? "집중 모드 닫기" : "집중 모드"}</span>
            </button>
            <Button onClick={openNewEditor} className="bg-black text-white hover:bg-black/80 text-xs h-8 rounded-none gap-1"><Plus size={12} /> 새 작품</Button>
          </div>
        </div>
      </header>

      <main className={`${focusMode ? "fixed inset-0 z-40 overflow-y-auto bg-[#f7f7f5]" : ""} max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 w-full`}>
        {focusMode && (
          <div className="flex justify-end mb-3">
            <button type="button" onClick={() => setFocusMode(false)} className="text-[11px] text-black/45 hover:text-black flex items-center gap-1"><Minimize2 size={12} /> 집중 모드 종료</button>
          </div>
        )}

        {showEditor ? (
          <section className="bg-white border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="px-4 sm:px-6 py-4 border-b border-black/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-black/35 mb-1">Writing workspace</p>
                <h1 className="text-base font-bold">{editingId ? "작품 수정" : "새 작품 집필"}</h1>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-black/40">
                <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${isDirty ? "bg-[oklch(0.7_0.16_70)]" : "bg-emerald-500"}`} />{isSaving ? "서버 저장 중" : saveStatus}</span>
                {lastSavedAt && <span className="hidden sm:inline">{new Date(lastSavedAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>}
                {draftAvailable && <button type="button" onClick={restoreDraft} className="underline underline-offset-4 hover:text-black">초안 복구</button>}
                <button type="button" onClick={resetForm} className="hover:text-black">닫기</button>
              </div>
            </div>

            <div className="px-4 sm:px-6 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)_120px] gap-3">
                <select value={authorId} onChange={(event) => { setAuthorId(event.target.value ? Number(event.target.value) : ""); markDirty(); }} className="text-xs border border-black/15 px-3 py-2.5 bg-white focus:outline-none focus:border-black/50">
                  <option value="">작가 선택</option>
                  {authors?.map((author) => <option key={author.id} value={author.id}>{author.name}</option>)}
                </select>
                <input type="text" placeholder="작품 제목" value={title} onChange={(event) => { setTitle(event.target.value); markDirty(); }} className="text-sm border border-black/15 px-3 py-2.5 bg-white focus:outline-none focus:border-black/50" />
                <select value={type} onChange={(event) => { setType(event.target.value as "poem" | "essay"); markDirty(); }} className="text-xs border border-black/15 px-3 py-2.5 bg-white focus:outline-none focus:border-black/50">
                  <option value="poem">시</option>
                  <option value="essay">산문</option>
                </select>
              </div>
            </div>

            <div className="lg:hidden grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 border-y border-black/8 py-3">
              <label className="text-[10px] text-black/45">크기 <input type="range" min="13" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="w-full accent-black" /></label>
              <label className="text-[10px] text-black/45">행간 <input type="range" min="1.4" max="2.6" step="0.1" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="w-full accent-black" /></label>
              <label className="text-[10px] text-black/45">본문 폭 <select value={editorWidth} onChange={(event) => setEditorWidth(event.target.value as typeof editorWidth)} className="w-full mt-1 border border-black/12 bg-white px-1.5 py-1"><option value="narrow">좁게</option><option value="standard">표준</option><option value="wide">넓게</option></select></label>
              <button type="button" onClick={() => setEditorTheme((theme) => theme === "paper" ? "night" : "paper")} className="text-[10px] text-black/45 border border-black/12 px-2 py-1 self-end">{editorTheme === "paper" ? "밝은 편집" : "어두운 편집"}</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[180px_minmax(0,1fr)_minmax(280px,340px)] gap-0 mt-5 border-t border-black/8">
              <aside className="hidden lg:block border-r border-black/8 p-4 bg-[#fbfbfa]">
                <div className="flex items-center gap-2 mb-4"><SlidersHorizontal size={13} className="text-black/45" /><span className="text-[10px] uppercase tracking-[0.16em] text-black/45">문서 설정</span></div>
                <div className="space-y-4">
                  <label className="block"><span className="flex justify-between text-[10px] text-black/45 mb-1"><span>글자 크기</span><span>{fontSize}px</span></span><input type="range" min="13" max="22" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} className="w-full accent-black" /></label>
                  <label className="block"><span className="flex justify-between text-[10px] text-black/45 mb-1"><span>행간</span><span>{lineHeight.toFixed(1)}</span></span><input type="range" min="1.4" max="2.6" step="0.1" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} className="w-full accent-black" /></label>
                  <label className="block"><span className="text-[10px] text-black/45 mb-1 block">본문 폭</span><select value={editorWidth} onChange={(event) => setEditorWidth(event.target.value as typeof editorWidth)} className="w-full text-[11px] border border-black/12 bg-white px-2 py-1.5"><option value="narrow">좁게</option><option value="standard">표준</option><option value="wide">넓게</option></select></label>
                  <button type="button" onClick={() => setEditorTheme((theme) => theme === "paper" ? "night" : "paper")} className="w-full flex items-center justify-between text-[10px] text-black/50 border border-black/10 px-2 py-1.5 hover:border-black/30"><span>편집 테마</span>{editorTheme === "paper" ? <Sun size={12} /> : <Moon size={12} />}</button>
                </div>
                <div className="mt-8 pt-4 border-t border-black/8"><div className="flex items-center gap-2 mb-3"><FileText size={13} className="text-black/45" /><span className="text-[10px] uppercase tracking-[0.16em] text-black/45">통계</span></div><Stat label="단어" value={wordCount} /><Stat label="문자" value={characterCount} /><Stat label="행" value={lineCount} /><Stat label="예상 읽기" value={`${readingMinutes}분`} /></div>
                <div className="mt-8 pt-4 border-t border-black/8"><div className="flex items-center gap-2 mb-3"><Search size={13} className="text-black/45" /><span className="text-[10px] uppercase tracking-[0.16em] text-black/45">찾기</span></div><div className="flex border border-black/12 bg-white"><input value={findQuery} onChange={(event) => setFindQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") findNext(); }} placeholder="본문 검색" className="min-w-0 w-full px-2 py-1.5 text-[11px] outline-none" /><button type="button" onClick={findNext} className="px-2 text-black/40 hover:text-black"><Search size={12} /></button></div><p className="text-[10px] text-black/30 mt-1">{findQuery ? `${matchCount}개 일치` : "Enter로 다음 결과"}</p></div>
              </aside>

              <div className={`min-w-0 border-b lg:border-b-0 lg:border-r border-black/8 ${editorTheme === "night" ? "bg-[#171717] text-white" : "bg-[#fffefa] text-black"}`}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-current/10"><div className="flex items-center gap-2 text-[10px] opacity-50"><BookOpen size={12} /> 원문 입력</div><span className="text-[10px] opacity-40">{cursorPosition.line}행 {cursorPosition.column}열 · {lineCount}행 · {characterCount}자</span></div>
                <EditorToolbar onBold={() => insertAtCursor("**", "**")} onItalic={() => insertAtCursor("*", "*")} onUnderline={() => insertAtCursor("__", "__")} onIndent={() => changeIndent("in")} onOutdent={() => changeIndent("out")} onStanzaBreak={insertStanzaBreak} onColor={() => insertAtCursor("{{color:", "}}" )} onLetterSpacing={() => insertAtCursor("{{ls:0.15em:", "}}" )} onUndo={runUndo} onRedo={runRedo} />
                <div className="flex items-center gap-2 px-4 py-2 border-b border-current/10 bg-[oklch(0.96_0.04_85)] text-[10px] text-black/55">
                  <span className="w-1.5 h-1.5 bg-[oklch(0.55_0.22_25)] shrink-0" />
                  <span className="uppercase tracking-[0.14em] text-black/35">현재 행</span>
                  <span className="truncate font-serif">{currentLineText || "빈 행"}</span>
                </div>
                <div className="relative">
                  <textarea id="editor-textarea" value={content} onChange={(event) => { setContent(event.target.value); updateCursorPosition(event.currentTarget); markDirty(); }} onSelect={(event) => updateCursorPosition(event.currentTarget)} onClick={(event) => updateCursorPosition(event.currentTarget)} onKeyUp={(event) => updateCursorPosition(event.currentTarget)} onKeyDown={composition.onKeyDown} onCompositionStart={composition.onCompositionStart} onCompositionEnd={composition.onCompositionEnd} placeholder={type === "poem" ? "이곳에서 시를 씁니다...\n\n줄바꿈 = 행 구분\n＜ = 연 구분\nEnter 줄바꿈은 미리보기에서 독립된 행으로 표시되며 긴 행의 이어지는 줄에는 자동 내어쓰기 적용" : "이곳에서 산문을 씁니다..."} className="w-full min-h-[460px] sm:min-h-[560px] p-5 sm:p-7 resize-y outline-none font-serif whitespace-pre-wrap" style={{ fontSize: `${fontSize}px`, lineHeight, color: "inherit", background: "transparent" }} />
                </div>
              </div>

              <div className="bg-white min-w-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-black/8"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-black/40"><BookOpen size={12} /> 실제 미리보기</div><span className="text-[10px] text-black/25">WorkPage style</span></div>
                <div className={`${editorWidthClass} mx-auto max-h-[620px] overflow-y-auto px-5 sm:px-7 py-6`}>
                  {content ? <ContentPreview content={content} type={type} fontSize={fontSize} lineHeight={lineHeight} /> : <p className="text-xs text-black/25 leading-relaxed">내용을 입력하면 작품 상세 페이지와 같은 방식으로 미리보기가 표시됩니다.</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-black/8 bg-[#fbfbfa]">
              <div className="flex items-center gap-3 text-[10px] text-black/35"><span>자동 저장은 이 브라우저의 로컬 초안에 적용됩니다.</span>{draftAvailable && <span className="text-black/55">복구 가능한 초안 있음</span>}</div>
              <div className="flex items-center gap-2"><button type="button" onClick={() => { setContent(""); markDirty(); }} className="flex items-center gap-1 text-[11px] text-black/40 hover:text-black px-2 py-1.5"><ResetIcon size={12} /> 본문 비우기</button><Button onClick={handleSubmit} disabled={isSaving} className="bg-black text-white hover:bg-black/80 text-xs h-9 rounded-none px-7 gap-1"><Save size={13} />{isSaving ? "저장 중..." : editingId ? "작품 수정 저장" : "작품 등록"}</Button></div>
            </div>
          </section>
        ) : (
          <section className="max-w-3xl mb-10">
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/35 mb-2">Writer's room</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-[-0.05em]">작품을 쓰는 곳</h1>
            <p className="mt-3 text-sm text-black/45 leading-relaxed">새 작품을 열어 원문을 입력하고, 서식·연 구분·들여쓰기·실시간 미리보기를 한 화면에서 조정하세요.</p>
            <button type="button" onClick={openNewEditor} className="mt-6 inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 text-xs hover:bg-black/80 transition-colors"><Plus size={13} /> 새 작품 집필 시작</button>
          </section>
        )}

        {!focusMode && (
          <section className="mt-12">
            <div className="flex items-center justify-between mb-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-black/35">Library</p><h2 className="text-sm font-bold mt-1">등록된 작품 목록</h2></div><span className="text-[10px] text-black/35">{allWorks?.length ?? 0}편</span></div>
            <div className="border-t border-black/10 bg-white">
              {allWorks?.map((work) => (
                <div key={work.id} className="flex items-center justify-between gap-3 py-3 px-3 border-b border-black/5 hover:bg-black/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0"><GripVertical size={12} className="text-black/20 shrink-0" /><input aria-label={`${work.title} 순서`} type="number" value={work.sortOrder} onChange={(event) => sortMutation.mutate({ workId: work.id, newSortOrder: Number(event.target.value) })} className="w-10 text-[10px] text-center border border-black/10 py-0.5 bg-white" /><span className="text-[10px] text-black/30 w-6 shrink-0">{work.type === "poem" ? "시" : "산문"}</span><span className="text-xs text-black/80 truncate">{work.title}</span><span className="hidden sm:inline text-[10px] text-black/30 shrink-0">— {work.authorName}</span></div>
                  <div className="flex items-center gap-2 shrink-0"><button type="button" onClick={() => handleEdit(work)} className="p-1 text-black/35 hover:text-black transition-colors" title="수정"><Edit3 size={12} /></button><button type="button" onClick={() => handleDelete(work.id, work.title)} className="p-1 text-black/35 hover:text-[oklch(0.55_0.22_25)] transition-colors" title="삭제"><Trash2 size={12} /></button></div>
                </div>
              ))}
              {(!allWorks || allWorks.length === 0) && <div className="py-8 text-center text-xs text-black/30">등록된 작품이 없습니다.</div>}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
