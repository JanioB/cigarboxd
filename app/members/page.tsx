"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutNavbar } from "../components/Navigation/LayoutNavbar";
import { Footer } from "../components/Navigation/Footer";

type PublicUser = {
  uid: string;
  displayName: string;
  bio: string;
  reviewCount: number;
  favoritesCount: number;
  triedCount: number;
  role: string;
};

export default function MembersPage() {
  const [items, setItems] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users", { cache: "no-store" });
        const payload = await response.json();
        setItems(payload.items || []);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-4 py-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              Members
            </p>
            <h1 className="tiempos mt-2 text-4xl text-p-white">Active accounts and collectors</h1>
          </div>
          <p className="text-sm text-sh-grey">
            {isLoading ? "Loading members..." : `${items.length} visible members`}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((user) => (
            <Link
              key={user.uid}
              href={`/profile/${user.uid}`}
              className="rounded-2xl border border-b-grey bg-review-bg/70 p-5 hover:border-hov-blue"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="tiempos text-2xl text-p-white">{user.displayName}</p>
                  <p className="mt-2 max-w-[42ch] text-sm leading-6 text-l-white">
                    {user.bio || "No public bio yet."}
                  </p>
                </div>
                <span className="graphik rounded-full border border-b-grey px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sh-grey">
                  {user.role}
                </span>
              </div>
              <div className="mt-4 flex gap-5 text-sm text-sh-grey">
                <span>{user.reviewCount} reviews</span>
                <span>{user.favoritesCount} favorites</span>
                <span>{user.triedCount} tried</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
