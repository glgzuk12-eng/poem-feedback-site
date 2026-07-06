import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<unknown>;
  error: string | null;
  isPending: boolean;
}

export function AdminLoginModal({ open, onClose, onLogin, error, isPending }: AdminLoginModalProps) {
  const [password, setPassword] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    try {
      await onLogin(password);
      setPassword("");
      onClose();
    } catch {
      // error is handled via prop
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white border border-black/10 p-6 sm:p-8 w-[90%] max-w-sm shadow-lg">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-black/30 hover:text-black transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-[oklch(0.55_0.22_25)]" />
          <h3 className="text-sm font-bold text-black">관리자 로그인</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 text-sm border border-black/15 bg-white focus:outline-none focus:border-black/40 placeholder:text-black/25 transition-colors mb-3"
          />

          {error && (
            <p className="text-[11px] text-[oklch(0.55_0.22_25)] mb-3">{error}</p>
          )}

          <Button
            type="submit"
            disabled={!password.trim() || isPending}
            className="w-full bg-black text-white hover:bg-black/80 text-xs py-2 h-auto rounded-none font-medium disabled:opacity-30"
          >
            {isPending ? "확인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
