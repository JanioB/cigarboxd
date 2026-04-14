import Link from "next/link";
import { CigaretteRecord } from "@/lib/types";

const placeholder = "/default-cigarette.svg";

export const CigaretteCard = ({
  item,
  showMeta = true,
}: {
  item: CigaretteRecord;
  showMeta?: boolean;
}) => {
  const imageUrl = item.imageUrl || placeholder;

  return (
    <Link
      href={`/cigarette/${item.id}`}
      className="group overflow-hidden rounded-xl border border-b-grey bg-review-bg/70 transition hover:border-hov-blue hover:bg-review-bg"
    >
      <div className="aspect-[4/5] overflow-hidden bg-b-blue">
        <img
          src={imageUrl}
          alt={`${item.brand} ${item.name}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="space-y-2 p-4">
        <div>
          <p className="graphik text-xs font-semibold uppercase tracking-[0.2em] text-sh-grey">
            {item.brand}
          </p>
          <h3 className="tiempos text-lg text-p-white">{item.name}</h3>
        </div>

        {showMeta && (
          <>
            <p className="graphik text-sm text-sh-grey">
              {item.subCategory || item.company || "Catalog entry"}
            </p>
            <div className="flex items-center justify-between text-sm text-l-white">
              <span>{item.averageRating.toFixed(1)}/5</span>
              <span>{item.reviewCount} reviews</span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

