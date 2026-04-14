import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="border-t border-b-grey bg-navigation-bg">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 py-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
              CIGARBOXXD
            </p>
            <p className="mt-2 max-w-[720px] text-sm text-l-white">
              Community reviews and cataloging for legally marketed cigarettes. No sales, no marketplace, no checkout.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-sh-grey">
            <Link href="/" className="hover:text-p-white">
              Home
            </Link>
            <Link href="/cigarettes" className="hover:text-p-white">
              Catalog
            </Link>
            <Link href="/reviews" className="hover:text-p-white">
              Reviews
            </Link>
            <Link href="/members" className="hover:text-p-white">
              Members
            </Link>
          </div>
        </div>
        <p className="text-xs leading-6 text-sh-grey">
          FDA tobacco product catalog data can be seeded from the Searchable Tobacco Products Database. Image suggestions can be sourced from Openverse when licensing allows, but exact pack imagery still needs manual review for rights and accuracy. Inspired by{" "}
          <a className="underline" href="https://letterboxd.com/">
            Letterboxd
          </a>
          .
        </p>
      </div>
    </footer>
  );
};
