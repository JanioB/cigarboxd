"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { useAppAuth } from "../Auth/AppAuthProvider";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/cigarettes", label: "Cigarettes" },
  { href: "/members", label: "Members" },
  { href: "/reviews", label: "Reviews" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAppAuth();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const links = useMemo(() => {
    if (profile?.role === "support" || profile?.role === "admin") {
      return [...navLinks, { href: "/admin", label: "Admin" }];
    }

    return navLinks;
  }, [profile?.role]);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();
    if (!query) {
      return;
    }

    router.push(`/results?searchTerm=${encodeURIComponent(query)}`);
    setSearch("");
    setMenuOpen(false);
  };

  const onLogout = async () => {
    await logout();
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/settings")) {
      router.push("/");
    }
  };

  return (
    <header className="border-b border-b-grey bg-navigation-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="block h-3 w-3 rounded-full bg-[#ff9f1c]" />
              <span className="block h-3 w-3 rounded-full bg-[#00c030]" />
              <span className="block h-3 w-3 rounded-full bg-[#40bcf4]" />
            </div>
            <div>
              <p className="graphik text-[11px] font-semibold uppercase tracking-[0.32em] text-sh-grey">
                CIGARBOXXD
              </p>
              <p className="tiempos text-lg text-p-white">Tobacco catalog and reviews</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="graphik rounded-md border border-b-grey px-3 py-2 text-xs uppercase tracking-[0.18em] text-sh-grey md:hidden"
          >
            Menu
          </button>
        </div>

        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } flex-col gap-4 md:flex md:flex-1 md:flex-row md:items-center md:justify-between`}
        >
          <nav className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`graphik text-sm font-semibold uppercase tracking-[0.18em] ${
                    active ? "text-p-white" : "text-sh-grey hover:text-p-white"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <form onSubmit={onSearch} className="flex items-center gap-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search cigarettes"
                className="graphik h-10 rounded-full border border-b-grey bg-input-bg px-4 text-sm text-p-white outline-none placeholder:text-sh-grey focus:border-hov-blue md:w-[220px]"
              />
              <button
                type="submit"
                className="graphik rounded-full border border-b-grey px-4 py-2 text-xs uppercase tracking-[0.18em] text-sh-grey hover:border-hov-blue hover:text-p-white"
              >
                Search
              </button>
            </form>

            {profile ? (
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                <Link href={`/profile/${profile.uid}`} className="text-sm text-p-white hover:text-hov-blue">
                  {profile.displayName}
                </Link>
                <Link href="/settings" className="graphik text-xs uppercase tracking-[0.18em] text-sh-grey hover:text-p-white">
                  Settings
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="graphik text-left text-xs uppercase tracking-[0.18em] text-sh-grey hover:text-p-white"
                >
                  Log out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="graphik inline-flex rounded-full bg-b-green px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-si-black"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
