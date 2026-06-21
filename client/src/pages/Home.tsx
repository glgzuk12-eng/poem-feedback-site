import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function Home() {
  const { data: authors, isLoading } = trpc.authors.list.useQuery();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-black py-5 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-3 h-3 bg-[oklch(0.55_0.22_25)] flex-shrink-0" />
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-black uppercase">
            꿈 포기 시 미리보기
          </h1>
        </div>
      </header>

      {/* Hero Section - Asymmetric Layout */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8">
        <section className="py-12 sm:py-20 grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 border-b border-black/10">
          {/* Left column - larger, offset */}
          <div className="sm:col-span-7 sm:col-start-1">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[oklch(0.55_0.22_25)] flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-black leading-none">
                  작가 목록
                </h2>
                <p className="mt-3 text-base sm:text-lg text-black/40 font-light">
                  12명의 작가, 58편의 작품
                </p>
              </div>
            </div>
          </div>
          {/* Right column - description, offset down */}
          <div className="sm:col-span-4 sm:col-start-9 sm:pt-8">
            <p className="text-sm text-black/50 font-light leading-relaxed border-l-2 border-[oklch(0.55_0.22_25)] pl-4">
              작가를 선택하여 작품을 감상하고 피드백을 남겨주세요.
            </p>
          </div>
        </section>

        {/* Authors Grid - Asymmetric */}
        <section className="py-8 sm:py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white p-6 sm:p-8 animate-pulse">
                  <div className="h-5 bg-black/5 w-20 mb-2" />
                  <div className="h-3 bg-black/5 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10 border border-black/10">
              {authors?.map((author, index) => (
                <Link
                  key={author.id}
                  href={`/author/${author.slug}`}
                  className="bg-white p-5 sm:p-7 group hover:bg-black transition-colors duration-200 block relative"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-black/25 group-hover:text-white/40 tracking-widest">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-black group-hover:text-white mt-1 tracking-tight">
                        {author.name}
                      </h3>
                    </div>
                    <div className="w-[6px] h-[6px] bg-[oklch(0.55_0.22_25)] group-hover:bg-white mt-2 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black py-6 px-4 sm:px-8 mt-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
            <span className="text-xs text-black/30 font-light">
              꿈 포기 시 미리보기 — 피드백 사이트
            </span>
          </div>
          <span className="text-[10px] text-black/20 font-mono hidden sm:block">
            2024
          </span>
        </div>
      </footer>
    </div>
  );
}
