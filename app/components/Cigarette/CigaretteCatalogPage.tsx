"use client";

import { useEffect, useState } from "react";
import { LayoutNavbar } from "../Navigation/LayoutNavbar";
import { Footer } from "../Navigation/Footer";
import { CigaretteCard } from "./CigaretteCard";
import { CigaretteRecord } from "@/lib/types";

export const CigaretteCatalogPage = ({ search }: { search: string }) => {
  const [items, setItems] = useState<CigaretteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);

      try {
        const query = new URLSearchParams();
        query.set("limit", "120");
        if (search) {
          query.set("search", search);
        }

        const response = await fetch(`/api/cigarettes?${query.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("The catalog is temporarily unavailable right now.");
        }

        const payload = await response.json();
        setItems(payload.items || []);
        setError("");
      } catch {
        setItems([]);
        setError("The catalog is temporarily unavailable right now.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [search]);

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-4 py-10">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              Cigarette catalog
            </p>
            <h1 className="tiempos mt-2 text-4xl text-p-white">
              {search ? `Results for "${search}"` : "Browse the full catalog"}
            </h1>
          </div>
          <p className="text-sm text-sh-grey">
            {isLoading ? "Loading entries..." : error ? "Catalog unavailable" : `${items.length} visible entries`}
          </p>
        </div>

        {error ? (
          <p className="text-[#ff9789]">{error}</p>
        ) : !isLoading && !items.length ? (
          <p className="text-sh-grey">
            {search ? "No cigarettes matched that search." : "The catalog is being prepared."}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <CigaretteCard key={item.id} item={item} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};
