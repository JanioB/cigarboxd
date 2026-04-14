"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutNavbar } from "../../components/Navigation/LayoutNavbar";
import { Footer } from "../../components/Navigation/Footer";
import { CigaretteCard } from "../../components/Cigarette/CigaretteCard";
import { ReviewCard } from "../../components/Review/ReviewCard";
import { useAppAuth } from "../../components/Auth/AppAuthProvider";
import { CigaretteRecord, ReviewRecord } from "@/lib/types";

type PublicUser = {
  uid: string;
  displayName: string;
  bio: string;
  reviewCount: number;
  favoritesCount: number;
  triedCount: number;
  role: string;
};

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const { profile, authenticatedFetch } = useAppAuth();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [favorites, setFavorites] = useState<CigaretteRecord[]>([]);
  const [tried, setTried] = useState<CigaretteRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const id = params.id;

  const load = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${id}`, { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not load this profile.");
      }

      const payload = await response.json();
      setUser(payload.user);
      setFavorites(payload.favorites || []);
      setTried(payload.tried || []);
      setReviews(payload.reviews || []);
      setError("");
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

  const deleteReview = async (reviewId: string) => {
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

  const isOwner = profile?.uid === user?.uid;

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-4 py-10">
        {isLoading && <p className="text-sh-grey">Loading profile...</p>}
        {error && <p className="text-sm text-[#ff9789]">{error}</p>}

        {user && (
          <div className="space-y-10">
            <section className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="tiempos text-4xl text-p-white">{user.displayName}</h1>
                    <span className="graphik rounded-full border border-b-grey px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-sh-grey">
                      {user.role}
                    </span>
                  </div>
                  <p className="mt-4 max-w-[62ch] text-base leading-7 text-l-white">
                    {user.bio || "No public bio yet."}
                  </p>
                </div>
                {isOwner && (
                  <Link
                    href="/settings"
                    className="graphik rounded-full border border-b-grey px-4 py-2 text-xs uppercase tracking-[0.18em] text-p-white"
                  >
                    Edit profile
                  </Link>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-6 text-sm text-sh-grey">
                <span>{user.reviewCount} reviews</span>
                <span>{user.favoritesCount} favorites</span>
                <span>{user.triedCount} tried</span>
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                  Favorite cigarettes
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {favorites.map((item) => (
                  <CigaretteCard key={item.id} item={item} />
                ))}
                {!favorites.length && <p className="text-sh-grey">No favorites yet.</p>}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                  Tried list
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {tried.map((item) => (
                  <CigaretteCard key={item.id} item={item} />
                ))}
                {!tried.length && <p className="text-sh-grey">Nothing marked as tried yet.</p>}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                  Published reviews
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    canDelete={
                      review.userId === profile?.uid ||
                      profile?.role === "support" ||
                      profile?.role === "admin"
                    }
                    onDelete={deleteReview}
                  />
                ))}
                {!reviews.length && <p className="text-sh-grey">No reviews yet.</p>}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

