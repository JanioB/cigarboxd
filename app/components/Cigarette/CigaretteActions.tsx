"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppAuth } from "../Auth/AppAuthProvider";

export const CigaretteActions = ({
  cigaretteId,
  favorites,
  tried,
  onChanged,
}: {
  cigaretteId: string;
  favorites: string[];
  tried: string[];
  onChanged?: () => unknown | Promise<unknown>;
}) => {
  const { profile, authenticatedFetch } = useAppAuth();
  const [isSaving, setIsSaving] = useState(false);
  const favoriteEnabled = useMemo(
    () => favorites.includes(cigaretteId),
    [favorites, cigaretteId]
  );
  const triedEnabled = useMemo(() => tried.includes(cigaretteId), [tried, cigaretteId]);

  const toggle = async (list: "favorites" | "tried") => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch(`/api/cigarettes/${cigaretteId}/lists`, {
        method: "POST",
        body: JSON.stringify({ list }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not update the list.");
      }

      await onChanged?.();
    } catch (error) {
      window.alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <Link
        href="/auth"
        className="graphik inline-flex rounded-md border border-b-grey px-3 py-2 text-sm text-p-white hover:border-hov-blue"
      >
        Sign in to track this pack
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={isSaving}
        onClick={() => toggle("favorites")}
        className={`graphik rounded-md px-3 py-2 text-sm font-semibold ${
          favoriteEnabled
            ? "bg-b-green text-si-black"
            : "border border-b-grey text-p-white hover:border-hov-blue"
        }`}
      >
        {favoriteEnabled ? "Favorited" : "Add to favorites"}
      </button>
      <button
        type="button"
        disabled={isSaving}
        onClick={() => toggle("tried")}
        className={`graphik rounded-md px-3 py-2 text-sm font-semibold ${
          triedEnabled
            ? "bg-hov-blue text-si-black"
            : "border border-b-grey text-p-white hover:border-hov-blue"
        }`}
      >
        {triedEnabled ? "Marked tried" : "Mark as tried"}
      </button>
    </div>
  );
};
