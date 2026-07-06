import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AuthorPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = trpc.authors.getBySlug.useQuery({ slug: slug || "" });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-black/10 py-6 px-4 sm:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="h-5 bg-black/5 w-32 animate-pulse" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
          <div className="h-8 bg-black/5 w-24 animate-pulse mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-black/5 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black/40">작가를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black/10 py-6 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-black/40 hover:text-black transition-colors">
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">목록</span>
          </Link>
          <div className="w-px h-4 bg-black/10" />
          <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
          <span className="text-sm font-medium text-black/60">꿈 포기 시 미리보기</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        {/* Author Title */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-6 h-6 sm:w-10 sm:h-10 bg-[oklch(0.55_0.22_25)] flex-shrink-0 mt-1" />
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-black">
                {data.name}
              </h1>
              <p className="mt-2 text-sm text-black/40 font-light">
                {data.works.length}편의 작품
              </p>
            </div>
          </div>
        </section>

        {/* Works List */}
        <section>
          <div className="border-t border-black">
            {data.works.map((work, index) => (
              <Link
                key={work.id}
                href={`/work/${work.slug}`}
                className="flex items-center justify-between py-5 sm:py-6 border-b border-black/10 group hover:pl-4 transition-all duration-200 block"
              >
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-medium text-black/25 tracking-widest w-6">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-black group-hover:text-[oklch(0.55_0.22_25)] transition-colors">
                      {work.title}
                      {(work as any).commentCount > 0 && (
                        <span className="ml-2 text-[10px] text-black/30 font-normal">
                          ({(work as any).commentCount})
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-black/30 font-light mt-0.5 block">
                      {work.type === "essay" ? "산문" : "시"}
                    </span>
                  </div>
                </div>
                <div className="w-1.5 h-1.5 bg-[oklch(0.55_0.22_25)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 py-8 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
          <span className="text-xs text-black/30 font-light">
            꿈 포기 시 미리보기 — 피드백 사이트
          </span>
        </div>
      </footer>
    </div>
  );
}
