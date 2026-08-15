import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPoemLines, getDisplayIndentStyle, type FormattedPoemLine } from "@/lib/poemFormatting";
import { parseInlineFormatting } from "@/components/PoemInlineText";
import { analyzePoem, type PoemLayoutSpec } from "../../../shared/poemLayout";

/**
 * Splits content by {{PAGE_BREAK}} markers into separate page blocks.
 * Each block represents one physical page from the PDF.
 */
function splitIntoPages(content: string): string[] {
  return content.split("{{PAGE_BREAK}}").map((page) => page.replace(/^\n+|\n+$/g, ""));
}

type BookPageTypography = {
  kind: "poem-title" | "poem-dense" | "poem-standard" | "poem-sparse" | "prose";
  columnWidth: string;
  columnOffset: string;
  topPadding: string;
  bodyWidth: string;
  fontSize: string;
  lineHeight: string;
  titleGap: string;
  stanzaGap: string;
};

function getBookPageTypography(
  content: string,
  type: "poem" | "essay",
  isFirstPage: boolean,
): BookPageTypography {
  const sourceLines = content.replace(/\r\n?/g, "\n").split("\n");
  const nonBlankLines = sourceLines.filter((line) => line.trim() !== "");
  const characterCount = Array.from(nonBlankLines.join("")).length;
  const longestLine = Math.max(
    0,
    ...nonBlankLines.map((line) => Array.from(line.trim()).length),
  );

  if (type === "essay") {
    return {
      kind: "prose",
      columnWidth: "78%",
      columnOffset: "2%",
      topPadding: "clamp(4.3rem, 9vw, 6rem)",
      bodyWidth: "100%",
      fontSize: "clamp(0.7rem, 1.08vw, 0.82rem)",
      lineHeight: "2.05",
      titleGap: "clamp(1.4rem, 3.2vw, 2.5rem)",
      stanzaGap: "1.15em",
    };
  }

  if (isFirstPage) {
    return {
      kind: "poem-title",
      columnWidth: "72%",
      columnOffset: "6%",
      topPadding: "clamp(3.9rem, 8.5vw, 5.75rem)",
      bodyWidth: "calc(var(--poem-measure) * 1.02em)",
      fontSize: "clamp(0.68rem, 1vw, 0.8rem)",
      lineHeight: "2.16",
      titleGap: "clamp(1.8rem, 4vw, 3rem)",
      stanzaGap: "1.35em",
    };
  }

  if (nonBlankLines.length <= 12 || characterCount <= 150) {
    return {
      kind: "poem-sparse",
      columnWidth: "70%",
      columnOffset: "6%",
      topPadding: "clamp(5.5rem, 15vw, 9.5rem)",
      bodyWidth: "calc(var(--poem-measure) * 1em)",
      fontSize: "clamp(0.68rem, 1vw, 0.8rem)",
      lineHeight: "2.16",
      titleGap: "0px",
      stanzaGap: "1.45em",
    };
  }

  if (nonBlankLines.length >= 18 || characterCount >= 420 || longestLine >= 34) {
    return {
      kind: "poem-dense",
      columnWidth: "76%",
      columnOffset: "4%",
      topPadding: "clamp(3.8rem, 8vw, 5.7rem)",
      bodyWidth: "calc(var(--poem-measure) * 1.08em)",
      fontSize: "clamp(0.66rem, 0.96vw, 0.77rem)",
      lineHeight: "2.08",
      titleGap: "0px",
      stanzaGap: "1.25em",
    };
  }

  return {
    kind: "poem-standard",
    columnWidth: "72%",
    columnOffset: "5%",
    topPadding: "clamp(4.5rem, 10vw, 6.75rem)",
    bodyWidth: "calc(var(--poem-measure) * 1.04em)",
    fontSize: "clamp(0.67rem, 0.98vw, 0.79rem)",
    lineHeight: "2.12",
    titleGap: "0px",
    stanzaGap: "1.35em",
  };
}

/**
 * BookPage component - renders a single page in the PDF book style.
 * Even pages: decorative lines on left, page number bottom-left.
 * Odd pages: decorative lines on right, author name + page number bottom-right.
 */
function BookPage({
  content,
  pageNumber,
  isEven,
  authorName,
  isFirstPage,
  title,
  type,
  layoutSpec,
}: {
  content: string;
  pageNumber: number;
  isEven: boolean;
  authorName: string;
  isFirstPage: boolean;
  title?: string;
  type: "poem" | "essay";
  layoutSpec?: PoemLayoutSpec;
}) {
  const lines = type === "poem" ? formatPoemLines(content) : content.split("\n");
  const pageTypography = getBookPageTypography(content, type, isFirstPage);
  const typesetStyle = ({
    "--poem-measure": String(layoutSpec?.measure ?? 24),
    "--poem-fit-width": String(layoutSpec?.fitWidth ?? 24),
    "--poem-turnover": String(layoutSpec?.turnover ?? 1),
    "--poem-overflow-wrap": layoutSpec?.overflowWrapAnywhere ? "anywhere" : "normal",
    "--poem-text-align": layoutSpec?.justify ? "justify" : "start",
    "--book-column-width": pageTypography.columnWidth,
    "--book-column-offset": pageTypography.columnOffset,
    "--book-top-padding": pageTypography.topPadding,
    "--book-body-width": pageTypography.bodyWidth,
    "--book-page-font-size": pageTypography.fontSize,
    "--book-page-line-height": pageTypography.lineHeight,
    "--book-title-gap": pageTypography.titleGap,
    "--book-stanza-gap": pageTypography.stanzaGap,
  } as React.CSSProperties);
  const bodyClassName = layoutSpec
    ? `book-body-text poem-profile-${layoutSpec.profile.toLowerCase()}`
    : "book-body-text essay-book-body";

  return (
    <div className={`book-page book-page-${pageTypography.kind} mb-4 sm:mb-8`}>
      {/* Corner registration marks are drawn by .book-page::before/after. */}

      {/* Page content area */}
      <div
        className={`book-page-content ${isEven ? "book-page-content-even" : "book-page-content-odd"}`}
        style={typesetStyle}
      >
        <div className="book-reading-column">
          {/* Title on first page */}
          {isFirstPage && title && (
            <div className="book-title-block">
              <h2 className="book-title">{title}</h2>
            </div>
          )}

          {/* Body text */}
          <div className={bodyClassName}>
          {lines.map((entry, i) => {
            if (type === "poem") {
              const line = entry as FormattedPoemLine;
              if (line.kind === "gap") return <div key={i} className="stanza-gap" />;
              return (
                <div
                  key={i}
                  className={`book-line ${line.kind === "marker" ? "book-marker-line" : ""}`}
                  style={line.kind === "line" ? getDisplayIndentStyle(line) : undefined}
                >
                  {parseInlineFormatting(line.text)}
                </div>
              );
            }

            const line = entry as string;
            if (line.trim() === "\uFF1C" || line.trim() === "<") {
              return <div key={i} className="book-line">{line.trim()}</div>;
            }
            if (!line.trim()) return <div key={i} className="stanza-gap" />;

                          return (
                <div key={i} className="book-line essay-line">
                  {parseInlineFormatting(line)}
                </div>
              );

          })}
          </div>
        </div>
      </div>

      {/* Footer: page number and author name */}
      <div
        className={`book-page-number absolute ${isEven ? "left-[13%]" : "right-[13%]"}`}
      >
        <span>{pageNumber}</span>
      </div>
    </div>
  );
}

export default function WorkPage() {
  const { slug } = useParams<{ slug: string }>();
  const [nickname, setNickname] = useState("");
  const [commentText, setCommentText] = useState("");

  const { data, isLoading } = trpc.works.getWithAuthor.useQuery({ slug: slug || "" });
  const { data: comments, refetch: refetchComments } = trpc.comments.listByWork.useQuery(
    { workId: data?.work?.id || 0 },
    { enabled: !!data?.work?.id }
  );

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setCommentText("");
      refetchComments();
      toast.success("피드백이 등록되었습니다.");
    },
    onError: () => {
      toast.error("피드백 등록에 실패했습니다.");
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !commentText.trim() || !data?.work?.id) return;
    createComment.mutate({
      workId: data.work.id,
      nickname: nickname.trim(),
      content: commentText.trim(),
    });
  };

  // Split content into pages
  const pages = useMemo(() => {
    if (!data?.work) return [];
    return splitIntoPages(data.work.content);
  }, [data?.work]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4f0]">
        <header className="py-5 px-4 sm:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="h-4 bg-black/5 w-32 animate-pulse" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white border border-black/[0.06] p-10 sm:p-14 animate-pulse">
            <div className="h-5 bg-black/5 w-40 mb-8" />
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-3 bg-black/5" style={{ width: `${50 + Math.random() * 40}%` }} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!data || !data.work) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <p className="text-black/40 text-sm">작품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { work, author } = data;
  const layoutSpec = work.type === "poem"
    ? (work.layoutSpec ?? analyzePoem(work.originalContent ?? work.content))
    : undefined;

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      {/* Minimal header */}
      <header className="py-4 sm:py-5 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={author ? `/author/${author.slug}` : "/"}
            className="flex items-center gap-2 text-black/40 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="text-xs font-medium">{author?.name || "목록"}</span>
          </Link>
          <div className="w-px h-3 bg-black/10" />
          <span className="text-xs text-black/30 font-light">{work.type === "essay" ? "산문" : "시"}</span>
        </div>
      </header>

      {/* Book pages */}
      <main className="max-w-2xl mx-auto px-3 sm:px-6 pb-12 sm:pb-16">
        {pages.map((pageContent, index) => (
          <BookPage
            key={index}
            content={pageContent}
            pageNumber={index + 1}
            isEven={(index + 1) % 2 === 0}
            authorName={author?.name || ""}
            isFirstPage={index === 0}
            title={index === 0 ? work.title : undefined}
            type={work.type as "poem" | "essay"}
            layoutSpec={layoutSpec}
          />
        ))}

        {/* Comments Section */}
        <section className="mt-10 sm:mt-14 bg-white border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
            <h2 className="text-sm font-bold text-black tracking-tight">
              피드백
            </h2>
            <span className="text-[10px] text-black/30 font-light ml-1">
              {comments?.length || 0}
            </span>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <div className="border border-black/8 p-4 sm:p-5">
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={50}
                  className="w-full sm:w-40 px-2 py-1.5 text-xs border-b border-black/15 bg-transparent focus:outline-none focus:border-black placeholder:text-black/25 transition-colors"
                />
              </div>
              <div className="mb-3">
                <textarea
                  placeholder="작품에 대한 피드백을 남겨주세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full px-2 py-1.5 text-xs border border-black/8 bg-white focus:outline-none focus:border-black/20 placeholder:text-black/25 resize-none transition-colors"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!nickname.trim() || !commentText.trim() || createComment.isPending}
                  className="bg-black text-white hover:bg-black/80 text-[11px] px-4 py-1.5 h-auto rounded-none font-medium disabled:opacity-30"
                >
                  <Send size={11} className="mr-1.5" />
                  등록
                </Button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-0">
            {comments?.map((comment) => (
              <div key={comment.id} className="py-3 border-b border-black/5 last:border-b-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-black">
                    {comment.nickname}
                  </span>
                  <span className="text-[9px] text-black/25">
                    {new Date(comment.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-xs text-black/55 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
            {comments?.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-[11px] text-black/25 font-light">
                  아직 피드백이 없습니다. 첫 번째 피드백을 남겨주세요.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 sm:px-8">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-[oklch(0.55_0.22_25)]" />
          <span className="text-[10px] text-black/25 font-light">
            꿈 포기 시 미리보기
          </span>
        </div>
      </footer>
    </div>
  );
}
