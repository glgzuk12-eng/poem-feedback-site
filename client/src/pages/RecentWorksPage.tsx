import { useMemo, useState } from "react";
import { ArrowLeft, Search, MessageCircle, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function formatDate(value: Date | string | number) {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RecentWorksPage() {
  const { data: works, isLoading, isError } = trpc.works.recentArchive.useQuery();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "poem" | "essay">("all");

  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (works ?? []).filter((work) => {
      const matchesType = typeFilter === "all" || work.type === typeFilter;
      const matchesQuery = !normalizedQuery || [work.title, work.authorName]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesType && matchesQuery;
    });
  }, [query, typeFilter, works]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <header className="border-b border-black/8 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[oklch(0.55_0.22_25)]" />
          <Link href="/" className="text-sm font-bold tracking-tight hover:opacity-60 transition-opacity">
            꿈 포기 시 미리보기
          </Link>
        </div>
        <Link href="/" className="text-[11px] text-black/45 hover:text-black flex items-center gap-1 transition-colors">
          <ArrowLeft size={12} /> 홈
        </Link>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-16">
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 lg:gap-16 mb-12">
          <div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[oklch(0.55_0.22_25)] mt-1 shrink-0" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-black/35 mb-3">Archive / Recent</p>
                <h1 className="text-3xl sm:text-5xl font-bold tracking-[-0.06em] leading-none">최근 업로드</h1>
                <p className="text-xs sm:text-sm text-black/45 mt-4 max-w-xl leading-relaxed">
                  가장 최근에 등록된 작품부터 차례로 읽어보세요. 시와 산문, 작가별 작품을 한 목록에서 탐색할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
          <div className="border-l-2 border-black/10 pl-4 self-end">
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/35">Total works</p>
            <p className="text-3xl font-light tracking-tight mt-1">{works?.length ?? "—"}</p>
            <p className="text-[11px] text-black/35 mt-1">최신 등록순</p>
          </div>
        </section>

        <section className="mb-8">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-y border-black/10 py-3">
            <label className="flex items-center gap-2 text-xs text-black/50 min-w-0">
              <Search size={14} className="shrink-0 text-black/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="작품명 또는 작가 검색"
                className="w-full sm:w-64 bg-transparent outline-none placeholder:text-black/25"
              />
            </label>
            <div className="flex items-center gap-1 text-[11px]">
              {(["all", "poem", "essay"] as const).map((value) => {
                const active = typeFilter === value;
                const label = value === "all" ? "전체" : value === "poem" ? "시" : "산문";
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={`px-2.5 py-1 border transition-colors ${active ? "border-black bg-black text-white" : "border-black/10 text-black/45 hover:border-black/30"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-[10px] text-black/30 mt-3">{filteredWorks.length}편 표시 · 작품을 선택하면 전문과 피드백을 볼 수 있습니다.</p>
        </section>

        <section aria-label="최근 업로드 작품 목록">
          <div className="hidden sm:grid grid-cols-[64px_minmax(0,1fr)_140px_90px_80px] gap-4 px-3 pb-2 text-[10px] uppercase tracking-[0.16em] text-black/30 border-b border-black/10">
            <span>Type</span>
            <span>Work</span>
            <span>Author</span>
            <span>Date</span>
            <span className="text-right">Feedback</span>
          </div>

          {isLoading && (
            <div className="border-b border-black/5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-16 border-b border-black/5 animate-pulse bg-black/[0.015]" />
              ))}
            </div>
          )}

          {isError && (
            <div className="py-16 text-center text-xs text-black/40 border-b border-black/10">
              작품 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
            </div>
          )}

          {!isLoading && !isError && filteredWorks.length === 0 && (
            <div className="py-16 text-center text-xs text-black/40 border-b border-black/10">
              검색 조건에 맞는 작품이 없습니다.
            </div>
          )}

          {!isLoading && !isError && filteredWorks.map((work, index) => (
            <Link key={work.id} href={`/work/${work.slug}`}>
              <article className="group grid grid-cols-1 sm:grid-cols-[64px_minmax(0,1fr)_140px_90px_80px] gap-2 sm:gap-4 sm:items-center px-3 py-4 sm:py-5 border-b border-black/7 hover:bg-black/[0.025] transition-colors cursor-pointer">
                <span className="flex items-center gap-2 text-[10px] text-black/35">
                  <span className="text-black/20 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                  <span className="uppercase">{work.type === "poem" ? "시" : "산문"}</span>
                </span>
                <div className="min-w-0 flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-medium truncate group-hover:underline underline-offset-4">{work.title}</h2>
                  <ArrowUpRight size={13} className="shrink-0 text-black/20 group-hover:text-black transition-colors" />
                </div>
                <span className="text-xs text-black/50">{work.authorName}</span>
                <time className="text-[11px] text-black/35" dateTime={new Date(work.createdAt).toISOString()}>{formatDate(work.createdAt)}</time>
                <span className="flex items-center sm:justify-end gap-1 text-[11px] text-black/35">
                  <MessageCircle size={12} /> {work.commentCount}
                </span>
              </article>
            </Link>
          ))}
        </section>
      </main>

      <footer className="border-t border-black/8 px-4 sm:px-8 py-3 flex items-center justify-between">
        <span className="text-[10px] text-black/30">꿈 포기 시 미리보기 — 피드백 아카이브</span>
        <span className="text-[10px] text-black/20">2024</span>
      </footer>
    </div>
  );
}
