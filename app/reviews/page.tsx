"use client";

import { useEffect, useState } from "react";
import { LayoutNavbar } from "../components/Navigation/LayoutNavbar";
import { Footer } from "../components/Navigation/Footer";
import { ReviewCard } from "../components/Review/ReviewCard";
import { useAppAuth } from "../components/Auth/AppAuthProvider";
import { ReviewRecord } from "@/lib/types";

export default function ReviewsPage() {
  const { profile, authenticatedFetch } = useAppAuth();
  const [items, setItems] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reviews?limit=50", { cache: "no-store" });
      const payload = await response.json();
      setItems(payload.items || []);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeReview = async (reviewId: string) => {
    try {
      const response = await authenticatedFetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not remove the review.");
      }

      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-4 py-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              Review feed
            </p>
            <h1 className="tiempos mt-2 text-4xl text-p-white">Latest cigarette notes</h1>
          </div>
          <p className="text-sm text-sh-grey">
            {isLoading ? "Loading reviews..." : `${items.length} reviews`}
          </p>
        </div>

        {error && <p className="mb-4 text-sm text-[#ff9789]">{error}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              canDelete={
                review.userId === profile?.uid ||
                profile?.role === "support" ||
                profile?.role === "admin"
              }
              onDelete={removeReview}
            />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

