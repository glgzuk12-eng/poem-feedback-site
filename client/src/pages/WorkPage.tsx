import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Splits content by {{PAGE_BREAK}} markers into separate page blocks.
 * Each block represents one physical page from the PDF.
 */
function splitIntoPages(content: string): string[] {
  return content.split("{{PAGE_BREAK}}").map((p) => p.trim());
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
}: {
  content: string;
  pageNumber: number;
  isEven: boolean;
  authorName: string;
  isFirstPage: boolean;
  title?: string;
}) {
  const lines = content.split("\n");

  return (
    <div className="book-page relative bg-white border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-4 sm:mb-6">
      {/* Decorative lines - left side for even pages */}
      {isEven && (
        <div className="absolute left-2 sm:left-3 top-0 bottom-0 flex flex-col justify-between py-8 sm:py-12 pointer-events-none">
          <div className="w-4 sm:w-5 h-px bg-black/30" />
          <div className="w-3 sm:w-4 h-px bg-black/30" />
          <div className="w-4 sm:w-5 h-px bg-black/30" />
        </div>
      )}

      {/* Decorative lines - right side for odd pages */}
      {!isEven && (
        <div className="absolute right-2 sm:right-3 top-0 bottom-0 flex flex-col justify-between py-12 sm:py-16 pointer-events-none">
          <div className="w-4 sm:w-5 h-px bg-black/30 ml-auto" />
          <div className="w-3 sm:w-4 h-px bg-black/30 ml-auto" />
        </div>
      )}

      {/* Page content area */}
      <div
        className={`
          px-8 sm:px-14 md:px-20 py-10 sm:py-14 md:py-18
          ${isEven ? "pl-10 sm:pl-16 md:pl-24" : "pr-10 sm:pr-16 md:pr-24"}
        `}
      >
        {/* Title on first page */}
        {isFirstPage && title && (
          <div className="mb-8 sm:mb-12">
            <h2 className="text-base sm:text-lg font-bold text-black tracking-tight leading-tight">
              {title}
            </h2>
          </div>
        )}

        {/* Body text */}
        <div className="book-body-text">
          {lines.map((line, i) => {
            // ＜ or < as standalone line - render as independent line in same style
            if (line.trim() === "\uFF1C" || line.trim() === "<") {
              return (
                <div key={i} className="book-line">
                  {line.trim()}
                </div>
              );
            }

            // Empty line = stanza break
            if (!line.trim()) {
              return <div key={i} className="stanza-gap" />;
            }

            // Regular line - preserve leading spaces as indentation
            const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;
            const indentEm = Math.floor(leadingSpaces / 2) * 1;

            return (
              <div
                key={i}
                className="book-line"
                style={indentEm > 0 ? { paddingLeft: `${indentEm}em` } : undefined}
              >
                {line.trimStart()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: page number and author name */}
      <div
        className={`
          absolute bottom-3 sm:bottom-4
          ${isEven ? "left-8 sm:left-14 md:left-20" : "right-8 sm:right-14 md:right-20"}
          text-[10px] sm:text-[11px] text-black/35 font-light tracking-wide
        `}
      >
        {isEven ? (
          <span>{pageNumber}</span>
        ) : (
          <span>
            {authorName} {pageNumber}
          </span>
        )}
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
