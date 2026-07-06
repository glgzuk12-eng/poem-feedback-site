import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAdmin } from "@/hooks/useAdmin";
import { AdminLoginModal } from "@/components/AdminLoginModal";
import { Settings, LogOut } from "lucide-react";

export default function Home() {
  const { data: authors, isLoading: authorsLoading } = trpc.authors.list.useQuery();
  const { data: recentWorks, isLoading: recentLoading } = trpc.works.recent.useQuery({ limit: 8 });
  const { isAdmin, login, logout, loginError, isLoginPending, isLogoutPending } = useAdmin();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-black/8 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[oklch(0.55_0.22_25)]" />
          <span className="text-sm font-bold tracking-tight text-black">꿈 포기 시 미리보기</span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Link href="/admin/editor">
                <span className="text-[11px] text-black/40 hover:text-black/70 cursor-pointer transition-colors border border-black/10 px-2 py-1">
                  글쓰기
                </span>
              </Link>
              <button
                onClick={() => logout()}
                disabled={isLogoutPending}
                className="text-[11px] text-black/40 hover:text-black/70 cursor-pointer transition-colors flex items-center gap-1"
              >
                <LogOut size={10} />
                로그아웃
              </button>
            </>
          )}
          <button
            onClick={() => setShowLoginModal(true)}
            className="text-black/15 hover:text-black/40 transition-colors p-1"
            title="관리"
          >
            <Settings size={12} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-8 py-8 sm:py-12 max-w-5xl mx-auto w-full">
        {/* Title Section */}
        <section className="mb-10">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 bg-[oklch(0.55_0.22_25)] mt-1 shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">작가 목록</h1>
              <p className="text-xs text-black/40 mt-1">
                {authors?.length || 0}명의 작가, {recentWorks ? "최근 작품 포함" : ""}
              </p>
            </div>
          </div>
          <div className="ml-11">
            <p className="text-xs text-black/50 border-l-2 border-black/10 pl-3">
              작가를 선택하여 작품을 감상하고 피드백을 남겨주세요.
            </p>
          </div>
        </section>

        {/* Recent Works Section */}
        {!recentLoading && recentWorks && recentWorks.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 bg-[oklch(0.55_0.22_25)]" />
              <h2 className="text-sm font-bold text-black">최근 업로드된 작품</h2>
            </div>
            <div className="border-t border-black/8">
              {recentWorks.map((work) => (
                <Link key={work.id} href={`/work/${work.slug}`}>
                  <div className="flex items-center justify-between py-2.5 px-2 border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] text-black/30 font-medium uppercase w-8 shrink-0">
                        {work.type === "poem" ? "시" : "산문"}
                      </span>
                      <span className="text-xs text-black/80 truncate group-hover:text-black transition-colors">
                        {work.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-black/30">{work.authorName}</span>
                      <span className="text-[10px] text-black/20">
                        {new Date(work.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        <hr className="border-black/8 mb-8" />

        {/* Authors Grid */}
        <section>
          {authorsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="py-3 border-b border-black/5">
                  <div className="h-3 w-20 bg-black/5 rounded mb-1" />
                  <div className="h-2 w-14 bg-black/3 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
              {authors?.map((author) => (
                <Link key={author.id} href={`/author/${author.slug}`}>
                  <div className="py-3 border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group px-2">
                    <div className="text-xs font-medium text-black/80 group-hover:text-black transition-colors">
                      {author.name}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/8 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-[oklch(0.55_0.22_25)]" />
          <span className="text-[10px] text-black/30">꿈 포기 시 미리보기 — 피드백 사이트</span>
        </div>
        <span className="text-[10px] text-black/20">2024</span>
      </footer>

      {/* Admin Login Modal */}
      <AdminLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={login}
        error={loginError}
        isPending={isLoginPending}
      />
    </div>
  );
}
