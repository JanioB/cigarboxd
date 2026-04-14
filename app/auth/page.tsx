"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutNavbar } from "../components/Navigation/LayoutNavbar";
import { Footer } from "../components/Navigation/Footer";
import { useAppAuth } from "../components/Auth/AppAuthProvider";

type Mode = "signin" | "register";

export default function AuthPage() {
  const router = useRouter();
  const { profile, login, register, isLoading, error } = useAppAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (profile) {
      router.replace(`/profile/${profile.uid}`);
    }
  }, [profile, router]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError("");

    try {
      if (mode === "signin") {
        await login(email, password);
      } else {
        await register({
          displayName,
          email,
          password,
        });
      }
    } catch (error) {
      setFormError((error as Error).message);
    }
  };

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto flex min-h-[80vh] max-w-[1080px] px-4 py-10">
        <div className="grid w-full gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              Access control
            </p>
            <h1 className="tiempos text-4xl text-p-white md:text-5xl">
              Sign in or create a controlled review account.
            </h1>
            <p className="max-w-[52ch] text-base leading-7 text-l-white">
              Registration is server-validated, respects the email blacklist, and can bootstrap the first administrator when
              `INITIAL_ADMIN_EMAIL` matches the new account.
            </p>
          </div>

          <div className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
            <div className="mb-6 flex gap-3">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`graphik rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  mode === "signin" ? "bg-b-green text-si-black" : "border border-b-grey text-p-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className={`graphik rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                  mode === "register" ? "bg-hov-blue text-si-black" : "border border-b-grey text-p-white"
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "register" && (
                <label className="block">
                  <span className="mb-2 block text-sm text-sh-grey">Display name</span>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="h-11 w-full rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm text-sh-grey">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11 w-full rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-sh-grey">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
              </label>

              {(formError || error) && (
                <p className="rounded-md border border-[#ff6b57]/40 bg-[#ff6b57]/10 px-3 py-2 text-sm text-[#ff9789]">
                  {formError || error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="graphik rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black disabled:opacity-60"
              >
                {isLoading ? "Working..." : mode === "signin" ? "Sign in" : "Register"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

