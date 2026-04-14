"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutNavbar } from "../components/Navigation/LayoutNavbar";
import { Footer } from "../components/Navigation/Footer";
import { useAppAuth } from "../components/Auth/AppAuthProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { profile, isLoading, authenticatedFetch, refreshProfile } = useAppAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth");
    }

    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio || "");
    }
  }, [profile, isLoading, router]);

  const onSave = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch("/api/account", {
        method: "PATCH",
        body: JSON.stringify({
          displayName,
          bio,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not update the profile.");
      }

      await refreshProfile();
      setMessage("Profile updated.");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[760px] px-4 py-10">
        <div className="mb-6">
          <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
            Settings
          </p>
          <h1 className="tiempos mt-2 text-4xl text-p-white">Update your profile</h1>
        </div>

        <form onSubmit={onSave} className="space-y-5 rounded-2xl border border-b-grey bg-review-bg/70 p-6">
          <label className="block">
            <span className="mb-2 block text-sm text-sh-grey">Display name</span>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="h-11 w-full rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-sh-grey">Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={7}
              className="w-full rounded-md border border-b-grey bg-input-bg px-3 py-3 text-p-white outline-none focus:border-hov-blue"
            />
          </label>

          {message && <p className="text-sm text-[#7cf7a4]">{message}</p>}
          {error && <p className="text-sm text-[#ff9789]">{error}</p>}

          <button
            type="submit"
            className="graphik rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
          >
            Save profile
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}

