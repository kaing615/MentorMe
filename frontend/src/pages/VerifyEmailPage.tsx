import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IconCircleCheck, IconLoader2, IconMail } from "@tabler/icons-react";
import publicClient from "../api/clients/public.client";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const email = params.get("email");
  const verifyKey = params.get("verifyKey");
  const [loading, setLoading] = useState(!!(email && verifyKey));
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!email || !verifyKey) return;
      setLoading(true);
      try {
        await publicClient.get(
          `/user/verify?email=${encodeURIComponent(email)}&verifyKey=${verifyKey}`
        );
        setIsVerified(true);
      } catch {
        // Bỏ qua lỗi, không show error
      } finally {
        setLoading(false);
      }
    };
    if (email && verifyKey) verifyEmail();
  }, [email, verifyKey]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--ui-page)] p-4">
        <div className="ui-card flex items-center gap-3 px-6 py-5 text-[var(--ui-text)]" role="status" aria-live="polite">
          <IconLoader2 className="animate-spin text-[var(--ui-accent)]" aria-hidden="true" size={24} />
          <span className="font-semibold">Đang xác thực email...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--ui-page)] p-4">
      <section className="ui-card w-full max-w-md px-6 py-10 text-center sm:px-10" aria-live="polite">
          <div className={`mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full ${isVerified ? "bg-[var(--ui-success-soft)] text-[var(--ui-success)]" : "bg-[var(--ui-warning-soft)] text-[var(--ui-warning)]"}`}>
            {isVerified ? <IconCircleCheck aria-hidden="true" size={34} stroke={1.8} /> : <IconMail aria-hidden="true" size={32} stroke={1.8} />}
          </div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--ui-text-subtle)]">
            {isVerified ? "Email verified" : "Check your inbox"}
          </p>
          {isVerified ? (
            <>
              <h1 className="mb-3 text-2xl font-bold tracking-[-0.03em] text-[var(--ui-text)]">
                Xác thực Email thành công!
              </h1>
              <p className="leading-7 text-[var(--ui-text-muted)]">
                Email của bạn đã được xác thực.<br />
                Bạn có thể đăng nhập ngay.
              </p>
              <button
                type="button"
                className="mt-7 min-h-12 w-full rounded-xl bg-[var(--ui-accent-fill)] px-5 py-3 font-bold text-[var(--ui-accent-contrast)] transition-colors hover:bg-[var(--ui-accent-fill-hover)]"
                onClick={() => navigate("/auth/signin")}
              >
                Đăng nhập
              </button>
            </>
          ) : (
            <>
              <h1 className="mb-3 text-2xl font-bold tracking-[-0.03em] text-[var(--ui-text)]">
                Đã gửi email xác thực
              </h1>
              <p className="break-words leading-7 text-[var(--ui-text-muted)]">
                {email ? (
                  <>
                    Chúng tôi đã gửi một email xác thực đến <strong className="text-[var(--ui-text)]">{email}</strong>.<br />
                    Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                  </>
                ) : (
                  <>
                    Chúng tôi đã gửi một email xác thực.<br />
                    Vui lòng kiểm tra hộp thư.
                  </>
                )}
              </p>
              <button
                type="button"
                className="mt-7 min-h-12 w-full rounded-xl bg-[var(--ui-accent-fill)] px-5 py-3 font-bold text-[var(--ui-accent-contrast)] transition-colors hover:bg-[var(--ui-accent-fill-hover)]"
                onClick={() => navigate("/auth/signin")}
              >
                Quay lại đăng nhập
              </button>
            </>
          )}
      </section>
    </main>
  );
};

export default VerifyEmailPage;
