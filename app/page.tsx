"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutNavbar } from "./components/Navigation/LayoutNavbar";
import { Footer } from "./components/Navigation/Footer";
import { CigaretteCard } from "./components/Cigarette/CigaretteCard";
import { ReviewCard } from "./components/Review/ReviewCard";
import { CigaretteRecord, ReviewRecord } from "@/lib/types";
import { useAppAuth } from "./components/Auth/AppAuthProvider";

export default function Page() {
  const { profile } = useAppAuth();
  const [featured, setFeatured] = useState<CigaretteRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [reviewsError, setReviewsError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const [catalogResponse, reviewsResponse] = await Promise.all([
          fetch("/api/cigarettes?featured=1&limit=8", { cache: "no-store" }),
          fetch("/api/reviews?limit=4", { cache: "no-store" }),
        ]);

        if (catalogResponse.ok) {
          const catalogPayload = await catalogResponse.json();
          setFeatured(catalogPayload.items || []);
          setCatalogError("");
        } else {
          setFeatured([]);
          setCatalogError("The catalog is temporarily unavailable.");
        }

        if (reviewsResponse.ok) {
          const reviewsPayload = await reviewsResponse.json();
          setReviews(reviewsPayload.items || []);
          setReviewsError("");
        } else {
          setReviews([]);
          setReviewsError("Reviews are temporarily unavailable.");
        }
      } catch {
        setFeatured([]);
        setReviews([]);
        setCatalogError("The catalog is temporarily unavailable.");
        setReviewsError("Reviews are temporarily unavailable.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <>
      <LayoutNavbar />
      <main className="site-body min-h-[80vh]">
        <section className="mx-auto grid max-w-[1080px] gap-8 px-4 py-10 md:grid-cols-[1.3fr_0.7fr] md:py-14">
          <div className="space-y-6">
            <p className="graphik text-xs font-semibold uppercase tracking-[0.3em] text-sh-grey">
              Cigarette catalog and reviews
            </p>
            <h1 className="tiempos max-w-[12ch] text-5xl leading-tight text-p-white md:text-6xl">
              Track the brands, packs and tasting notes worth remembering.
            </h1>
            <p className="max-w-[58ch] text-base leading-7 text-l-white">
              Browse the catalog, keep track of what you&apos;ve tried, and publish reviews in a moderated
              community.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/cigarettes"
                className="graphik inline-flex items-center justify-center whitespace-nowrap rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
              >
                Browse the catalog
              </Link>
              <Link
                href={profile ? `/profile/${profile.uid}` : "/auth"}
                className="graphik inline-flex items-center justify-center whitespace-nowrap rounded-full border border-b-grey px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-p-white"
              >
                {profile ? "Open your profile" : "Create an account"}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-b-grey bg-review-bg/60 p-6">
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              Moderated community
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-l-white">
              <li>Keep notes on the cigarettes you&apos;ve tried and the packs you want to revisit.</li>
              <li>Build favorites, public profiles, and review history.</li>
              <li>Reviews, comments, and accounts are actively moderated.</li>
              <li>Admins can manage catalog entries, support staff, and abuse controls.</li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-4 py-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                Featured packs
              </p>
              <h2 className="tiempos mt-2 text-3xl text-p-white">Most reviewed catalog entries</h2>
            </div>
            <Link href="/cigarettes" className="text-sm text-hov-blue">
              See the full catalog
            </Link>
          </div>

          {isLoading ? (
            <p className="text-sh-grey">Loading catalog...</p>
          ) : catalogError ? (
            <p className="text-[#ff9789]">{catalogError}</p>
          ) : !featured.length ? (
            <p className="text-sh-grey">The catalog is being prepared.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((item) => (
                <CigaretteCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-[1080px] px-4 py-10">
          <div className="mb-5">
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              Fresh notes
            </p>
            <h2 className="tiempos mt-2 text-3xl text-p-white">Latest community reviews</h2>
          </div>

          {isLoading ? (
            <p className="text-sh-grey">Loading reviews...</p>
          ) : reviewsError ? (
            <p className="text-[#ff9789]">{reviewsError}</p>
          ) : !reviews.length ? (
            <p className="text-sh-grey">No reviews have been published yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
