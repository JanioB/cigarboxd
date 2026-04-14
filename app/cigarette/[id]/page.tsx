"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutNavbar } from "../../components/Navigation/LayoutNavbar";
import { Footer } from "../../components/Navigation/Footer";
import { CigaretteActions } from "../../components/Cigarette/CigaretteActions";
import { ReviewCard } from "../../components/Review/ReviewCard";
import { useAppAuth } from "../../components/Auth/AppAuthProvider";
import { CigaretteRecord, ReviewRecord } from "@/lib/types";

const placeholder = "/default-cigarette.svg";

export default function CigaretteDetailPage() {
  const params = useParams<{ id: string }>();
  const { profile, authenticatedFetch, refreshProfile } = useAppAuth();
  const [item, setItem] = useState<CigaretteRecord | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [rating, setRating] = useState("4");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const id = params.id;
  const existingReview = useMemo(
    () => reviews.find((review) => review.userId === profile?.uid),
    [reviews, profile?.uid]
  );

  const load = async () => {
    setIsLoading(true);
    try {
      const [itemResponse, reviewsResponse] = await Promise.all([
        fetch(`/api/cigarettes/${id}`, { cache: "no-store" }),
        fetch(`/api/cigarettes/${id}/reviews`, { cache: "no-store" }),
      ]);

      if (!itemResponse.ok) {
        throw new Error("Could not load this cigarette.");
      }

      const itemPayload = await itemResponse.json();
      const reviewsPayload = await reviewsResponse.json();
      setItem(itemPayload.item);
      setReviews(reviewsPayload.items || []);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      load();
    }
  }, [id]);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await authenticatedFetch(`/api/cigarettes/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: Number(rating),
          body,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not save your review.");
      }

      setBody("");
      setRating("4");
      await Promise.all([load(), refreshProfile()]);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      const response = await authenticatedFetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not remove the review.");
      }

      await Promise.all([load(), refreshProfile()]);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-4 py-10">
        {isLoading && <p className="text-sh-grey">Loading cigarette entry...</p>}
        {!isLoading && error && !item && <p className="text-[#ff9789]">{error}</p>}

        {item && (
          <div className="space-y-10">
            <section className="grid gap-8 md:grid-cols-[320px_1fr]">
              <div className="overflow-hidden rounded-2xl border border-b-grey bg-review-bg/60">
                <img
                  src={item.imageUrl || placeholder}
                  alt={`${item.brand} ${item.name}`}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>

              <div className="space-y-5">
                <div>
                  <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                    {item.brand}
                  </p>
                  <h1 className="tiempos mt-2 text-5xl text-p-white">{item.name}</h1>
                  <p className="mt-3 max-w-[65ch] text-base leading-7 text-l-white">
                    {item.description || item.additionalInformation || "No extended description yet."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-5 rounded-2xl border border-b-grey bg-review-bg/60 p-5 text-sm text-l-white">
                  <div>
                    <p className="graphik uppercase tracking-[0.16em] text-sh-grey">Average rating</p>
                    <p className="mt-1 text-p-white">{item.averageRating.toFixed(1)}/5</p>
                  </div>
                  <div>
                    <p className="graphik uppercase tracking-[0.16em] text-sh-grey">Reviews</p>
                    <p className="mt-1 text-p-white">{item.reviewCount}</p>
                  </div>
                  <div>
                    <p className="graphik uppercase tracking-[0.16em] text-sh-grey">Sub-category</p>
                    <p className="mt-1 text-p-white">{item.subCategory || "Unspecified"}</p>
                  </div>
                  <div>
                    <p className="graphik uppercase tracking-[0.16em] text-sh-grey">Source</p>
                    <p className="mt-1 text-p-white">{item.source.toUpperCase()}</p>
                  </div>
                </div>

                <CigaretteActions
                  cigaretteId={item.id}
                  favorites={profile?.favorites || []}
                  tried={profile?.tried || []}
                  onChanged={refreshProfile}
                />

                {(item.sourceLinks || []).length > 0 && (
                  <div className="rounded-2xl border border-b-grey bg-review-bg/60 p-5">
                    <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                      Source material
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {item.sourceLinks?.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          className="text-sm text-hov-blue"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
                <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                  Review this entry
                </p>
                {!profile && (
                  <p className="mt-4 text-sm text-l-white">
                    <Link href="/auth" className="text-hov-blue">
                      Sign in
                    </Link>{" "}
                    to add a review.
                  </p>
                )}
                {profile && existingReview && (
                  <p className="mt-4 text-sm text-sh-grey">
                    You already have an active review on this cigarette.
                  </p>
                )}
                {profile && !existingReview && (
                  <form onSubmit={submitReview} className="mt-5 space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm text-sh-grey">Rating</span>
                      <select
                        value={rating}
                        onChange={(event) => setRating(event.target.value)}
                        className="h-11 w-full rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                      >
                        {["0.5", "1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"].map((value) => (
                          <option key={value} value={value}>
                            {value}/5
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm text-sh-grey">Notes</span>
                      <textarea
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        rows={8}
                        className="w-full rounded-md border border-b-grey bg-input-bg px-3 py-3 text-p-white outline-none focus:border-hov-blue"
                      />
                    </label>
                    {error && <p className="text-sm text-[#ff9789]">{error}</p>}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="graphik rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
                    >
                      {isSaving ? "Saving..." : "Publish review"}
                    </button>
                  </form>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                      Community notes
                    </p>
                    <h2 className="tiempos mt-2 text-3xl text-p-white">
                      {reviews.length ? `${reviews.length} active reviews` : "No reviews yet"}
                    </h2>
                  </div>
                </div>

                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    showProduct={false}
                    canDelete={
                      review.userId === profile?.uid ||
                      profile?.role === "support" ||
                      profile?.role === "admin"
                    }
                    onDelete={deleteReview}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
