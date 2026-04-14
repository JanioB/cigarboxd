"use client";

import Link from "next/link";
import { ReviewRecord } from "@/lib/types";

export const ReviewCard = ({
  review,
  canDelete = false,
  onDelete,
  showProduct = true,
}: {
  review: ReviewRecord;
  canDelete?: boolean;
  onDelete?: (reviewId: string) => Promise<void> | void;
  showProduct?: boolean;
}) => {
  return (
    <article className="rounded-xl border border-b-grey bg-review-bg/70 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/profile/${review.userId}`}
            className="graphik text-sm font-semibold uppercase tracking-[0.14em] text-hov-blue"
          >
            {review.userDisplayName}
          </Link>
          {showProduct && (
            <p className="mt-1 text-sm text-sh-grey">
              on{" "}
              <Link href={`/cigarette/${review.cigaretteId}`} className="text-p-white hover:text-hov-blue">
                {review.cigaretteBrand} {review.cigaretteName}
              </Link>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="graphik text-sm text-p-white">{review.rating.toFixed(1)}/5</p>
          <p className="text-xs text-sh-grey">
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-6 text-p-white/90">{review.body}</p>

      {canDelete && onDelete && (
        <button
          type="button"
          onClick={() => onDelete(review.id)}
          className="graphik mt-4 rounded-md border border-b-grey px-3 py-2 text-xs uppercase tracking-[0.18em] text-sh-grey hover:border-[#ff6b57] hover:text-[#ff6b57]"
        >
          Remove review
        </button>
      )}
    </article>
  );
};

