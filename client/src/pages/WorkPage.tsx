import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Renders poem content preserving line breaks and indentation.
 * ＜ marks stanza/section breaks.
 * Leading spaces represent indentation.
 */
function PoemRenderer({ content, type }: { content: string; type: string }) {
  if (type === "essay") {
    // Essay: render as paragraphs
    const paragraphs = content.split(/\n{2,}/);
    return (
      <div className="essay-content">
        {paragraphs.map((para, i) => (
          <p key={i} className="mb-4 text-black/80 leading-relaxed">
            {para.split('\n').map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        ))}
      </div>
    );
  }

  // Poem: preserve exact line breaks and indentation
  const lines = content.split('\n');
  
  return (
    <div className="poem-content text-black/85">
      {lines.map((line, i) => {
        // ＜ is a stanza/section break marker - display it visually
        if (line.trim() === '＜') {
          return (
            <div key={i} className="my-4 sm:my-6 text-black/20 text-center select-none">
              ＜
            </div>
          );
        }
        
        // Empty line = stanza break
        if (!line.trim()) {
          return <div key={i} className="h-4 sm:h-5" />;
        }
        
        // Calculate indentation from leading spaces
        const leadingSpaces = line.match(/^(\s*)/)?.[1]?.length || 0;
        const indentLevel = Math.floor(leadingSpaces / 2);
        const trimmedLine = line.trimStart();
        
        return (
          <div
            key={i}
            className="min-h-[1.8em]"
            style={{ paddingLeft: `${indentLevel * 1}em` }}
          >
            {trimmedLine}
          </div>
        );
      })}
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black/10 py-6 px-4 sm:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="h-5 bg-black/5 w-32 animate-pulse" />
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
          <div className="h-10 bg-black/5 w-48 animate-pulse mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 bg-black/5 animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!data || !data.work) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black/40">작품을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { work, author } = data;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black/10 py-6 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link
            href={author ? `/author/${author.slug}` : "/"}
            className="flex items-center gap-2 text-black/40 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">{author?.name || "목록"}</span>
          </Link>
          <div className="w-px h-4 bg-black/10" />
          <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
        </div>
      </header>

      {/* Work Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {/* Title */}
        <section className="mb-8 sm:mb-12">
          <div className="flex items-start gap-3 sm:gap-4 mb-4">
            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[oklch(0.55_0.22_25)] flex-shrink-0 mt-2" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black leading-tight">
                {work.title}
              </h1>
              <p className="mt-1 text-sm text-black/40 font-light">
                {author?.name} · {work.type === "essay" ? "산문" : "시"}
              </p>
            </div>
          </div>
          {/* Title-content separator — */}
          <div className="mt-8 mb-2 text-black tracking-widest text-left">
            <span className="text-lg">———</span>
          </div>
        </section>

        {/* Content */}
        <section className="mb-16 sm:mb-24 pl-0 sm:pl-2">
          <PoemRenderer content={work.content} type={work.type} />
        </section>

        {/* Comments Section */}
        <section className="border-t border-black pt-8 sm:pt-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-3 h-3 bg-[oklch(0.55_0.22_25)]" />
            <h2 className="text-lg sm:text-xl font-bold text-black">
              피드백
            </h2>
            <span className="text-sm text-black/30 font-light">
              {comments?.length || 0}
            </span>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-10">
            <div className="border border-black/10 p-4 sm:p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={50}
                  className="w-full sm:w-48 px-3 py-2 text-sm border-b border-black/20 bg-transparent focus:outline-none focus:border-black placeholder:text-black/25 transition-colors"
                />
              </div>
              <div className="mb-4">
                <textarea
                  placeholder="작품에 대한 피드백을 남겨주세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-black/10 bg-white focus:outline-none focus:border-black/30 placeholder:text-black/25 resize-none transition-colors"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!nickname.trim() || !commentText.trim() || createComment.isPending}
                  className="bg-black text-white hover:bg-black/80 text-sm px-5 py-2 h-auto rounded-none font-medium disabled:opacity-30"
                >
                  <Send size={14} className="mr-2" />
                  등록
                </Button>
              </div>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-0">
            {comments?.map((comment) => (
              <div key={comment.id} className="py-4 border-b border-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-black">
                    {comment.nickname}
                  </span>
                  <span className="text-[10px] text-black/25">
                    {new Date(comment.createdAt).toLocaleDateString("ko-KR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-sm text-black/60 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
            {comments?.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-black/25 font-light">
                  아직 피드백이 없습니다. 첫 번째 피드백을 남겨주세요.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 py-8 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
          <span className="text-xs text-black/30 font-light">
            꿈 포기 시 미리보기 — 피드백 사이트
          </span>
        </div>
      </footer>
    </div>
  );
}
