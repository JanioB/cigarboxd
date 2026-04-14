"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutNavbar } from "../components/Navigation/LayoutNavbar";
import { Footer } from "../components/Navigation/Footer";
import { ReviewCard } from "../components/Review/ReviewCard";
import { CigaretteCard } from "../components/Cigarette/CigaretteCard";
import { useAppAuth } from "../components/Auth/AppAuthProvider";
import {
  BlacklistedEmailRecord,
  CigaretteRecord,
  OpenverseImageResult,
  ReviewRecord,
  UserProfile,
} from "@/lib/types";

const emptyCigaretteForm = {
  brand: "",
  name: "",
  company: "",
  subCategory: "",
  submissionType: "",
  dateOfAction: "",
  description: "",
  imageUrl: "",
  imageAttribution: "",
  imageLicense: "",
  imageSourceUrl: "",
  additionalInformation: "",
};

const SectionHeader = ({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: string;
}) => (
  <div className="mb-4">
    <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
      {eyebrow}
    </p>
    <h2 className="tiempos mt-2 text-3xl text-p-white">{title}</h2>
  </div>
);

export default function AdminPage() {
  const router = useRouter();
  const { profile, isLoading, authenticatedFetch } = useAppAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [cigarettes, setCigarettes] = useState<CigaretteRecord[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistedEmailRecord[]>([]);
  const [cigaretteForm, setCigaretteForm] = useState(emptyCigaretteForm);
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "support",
  });
  const [blacklistForm, setBlacklistForm] = useState({
    email: "",
    reason: "",
  });
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});
  const [imageQuery, setImageQuery] = useState("");
  const [imageResults, setImageResults] = useState<OpenverseImageResult[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isAdmin = profile?.role === "admin";
  const isSupport = profile?.role === "support" || isAdmin;

  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    [users]
  );

  const load = async () => {
    setError("");

    try {
      const [usersResponse, reviewsResponse, cigarettesResponse] = await Promise.all([
        authenticatedFetch("/api/admin/users"),
        fetch("/api/reviews?limit=20", { cache: "no-store" }),
        fetch("/api/cigarettes?limit=24", { cache: "no-store" }),
      ]);

      const usersPayload = await usersResponse.json();
      const reviewsPayload = await reviewsResponse.json();
      const cigarettesPayload = await cigarettesResponse.json();

      setUsers(usersPayload.items || []);
      setReviews(reviewsPayload.items || []);
      setCigarettes(cigarettesPayload.items || []);
      setRoleDrafts(
        Object.fromEntries(
          (usersPayload.items || []).map((user: UserProfile) => [user.uid, user.role])
        )
      );

      if (isAdmin) {
        const blacklistResponse = await authenticatedFetch("/api/admin/blacklist");
        const blacklistPayload = await blacklistResponse.json();
        setBlacklist(blacklistPayload.items || []);
      }
    } catch (error) {
      setError((error as Error).message);
    }
  };

  useEffect(() => {
    if (!isLoading && !profile) {
      router.replace("/auth");
    }

    if (!isLoading && profile && !isSupport) {
      router.replace("/");
    }
  }, [profile, isLoading, isSupport, router]);

  useEffect(() => {
    if (isSupport) {
      load();
    }
  }, [isSupport, isAdmin]);

  const moderateUser = async (userId: string, action: string, role?: string) => {
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          role,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not update the account.");
      }

      setMessage("Account updated.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const removeReview = async (reviewId: string) => {
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not remove the review.");
      }

      setMessage("Review removed.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const createCatalogItem = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch("/api/cigarettes", {
        method: "POST",
        body: JSON.stringify(cigaretteForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not create the catalog entry.");
      }

      setCigaretteForm(emptyCigaretteForm);
      setImageResults([]);
      setImageQuery("");
      setMessage("Catalog entry created.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const archiveCigarette = async (id: string) => {
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(`/api/cigarettes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not archive the catalog entry.");
      }

      setMessage("Catalog entry archived.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const createManagedUser = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(createUserForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not create the managed account.");
      }

      setCreateUserForm({
        email: "",
        password: "",
        displayName: "",
        role: "support",
      });
      setMessage("Managed account created.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const addBlacklist = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch("/api/admin/blacklist", {
        method: "POST",
        body: JSON.stringify(blacklistForm),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not add the blacklist entry.");
      }

      setBlacklistForm({
        email: "",
        reason: "",
      });
      setMessage("Blacklist updated.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const removeBlacklist = async (emailKey: string) => {
    setError("");
    setMessage("");

    try {
      const response = await authenticatedFetch(`/api/admin/blacklist/${emailKey}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not remove the blacklist entry.");
      }

      setMessage("Blacklist entry removed.");
      await load();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const runImageSearch = async () => {
    setError("");

    try {
      const response = await authenticatedFetch(
        `/api/admin/image-search?query=${encodeURIComponent(imageQuery)}`
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Could not fetch image suggestions.");
      }

      const payload = await response.json();
      setImageResults(payload.items || []);
    } catch (error) {
      setError((error as Error).message);
    }
  };

  if (!isSupport) {
    return null;
  }

  return (
    <>
      <LayoutNavbar />
      <main className="mx-auto min-h-[80vh] max-w-[1080px] px-4 py-10">
        <div className="mb-8">
          <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
            Operations
          </p>
          <h1 className="tiempos mt-2 text-4xl text-p-white">
            {isAdmin ? "Admin dashboard" : "Support dashboard"}
          </h1>
        </div>

        {message && <p className="mb-4 text-sm text-[#7cf7a4]">{message}</p>}
        {error && <p className="mb-4 text-sm text-[#ff9789]">{error}</p>}

        <div className="space-y-10">
          {isAdmin && (
            <section className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
              <SectionHeader eyebrow="Catalog management" title="Add or archive cigarette entries" />

              <form onSubmit={createCatalogItem} className="grid gap-4 md:grid-cols-2">
                {Object.entries(cigaretteForm).map(([key, value]) => {
                  const isLongField =
                    key === "description" || key === "additionalInformation";

                  return (
                    <label
                      key={key}
                      className={`block ${isLongField ? "md:col-span-2" : ""}`}
                    >
                      <span className="mb-2 block text-sm capitalize text-sh-grey">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      {isLongField ? (
                        <textarea
                          rows={4}
                          value={value}
                          onChange={(event) =>
                            setCigaretteForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-b-grey bg-input-bg px-3 py-3 text-p-white outline-none focus:border-hov-blue"
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(event) =>
                            setCigaretteForm((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                          className="h-11 w-full rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                        />
                      )}
                    </label>
                  );
                })}

                <div className="md:col-span-2">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <input
                      value={imageQuery}
                      onChange={(event) => setImageQuery(event.target.value)}
                      placeholder="Search Openverse for free imagery"
                      className="h-11 flex-1 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                    />
                    <button
                      type="button"
                      onClick={runImageSearch}
                      className="graphik rounded-full border border-b-grey px-4 py-2 text-xs uppercase tracking-[0.18em] text-p-white"
                    >
                      Find images
                    </button>
                  </div>
                  {!!imageResults.length && (
                    <div className="mt-4 grid gap-4 md:grid-cols-4">
                      {imageResults.map((image) => (
                        <button
                          type="button"
                          key={image.id}
                          onClick={() =>
                            setCigaretteForm((current) => ({
                              ...current,
                              imageUrl: image.url,
                              imageAttribution: image.attribution,
                              imageLicense: image.license,
                              imageSourceUrl: image.foreignLandingUrl,
                            }))
                          }
                          className="overflow-hidden rounded-xl border border-b-grey bg-b-blue text-left"
                        >
                          <img
                            src={image.thumbnail || image.url}
                            alt={image.title}
                            className="aspect-square w-full object-cover"
                          />
                          <div className="p-3">
                            <p className="text-sm text-p-white">{image.title}</p>
                            <p className="mt-1 text-xs text-sh-grey">{image.creator}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="graphik rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
                  >
                    Create entry
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
                  Current entries
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {cigarettes.map((item) => (
                    <div key={item.id} className="space-y-3">
                      <CigaretteCard item={item} />
                      <button
                        type="button"
                        onClick={() => archiveCigarette(item.id)}
                        className="graphik rounded-md border border-b-grey px-3 py-2 text-xs uppercase tracking-[0.18em] text-sh-grey hover:border-[#ff6b57] hover:text-[#ff6b57]"
                      >
                        Archive
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
            <SectionHeader eyebrow="Review moderation" title="Remove abusive or off-topic comments" />
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} canDelete onDelete={removeReview} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
            <SectionHeader eyebrow="Account moderation" title="Ban, delete, and role-manage accounts" />

            {isAdmin && (
              <form onSubmit={createManagedUser} className="mb-8 grid gap-4 md:grid-cols-4">
                <input
                  value={createUserForm.displayName}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      displayName: event.target.value,
                    }))
                  }
                  placeholder="Display name"
                  className="h-11 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Email"
                  className="h-11 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
                <input
                  type="password"
                  value={createUserForm.password}
                  onChange={(event) =>
                    setCreateUserForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Temporary password"
                  className="h-11 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
                <div className="flex gap-3">
                  <select
                    value={createUserForm.role}
                    onChange={(event) =>
                      setCreateUserForm((current) => ({
                        ...current,
                        role: event.target.value,
                      }))
                    }
                    className="h-11 flex-1 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                  >
                    <option value="support">support</option>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <button
                    type="submit"
                    className="graphik rounded-full bg-b-green px-4 py-2 text-xs uppercase tracking-[0.18em] text-si-black"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {sortedUsers.map((user) => (
                <div key={user.uid} className="rounded-xl border border-b-grey bg-b-blue/40 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg text-p-white">{user.displayName}</p>
                      <p className="text-sm text-sh-grey">
                        {user.email} · {user.status} · {user.role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {isAdmin && (
                        <>
                          <select
                            value={roleDrafts[user.uid] || user.role}
                            onChange={(event) =>
                              setRoleDrafts((current) => ({
                                ...current,
                                [user.uid]: event.target.value,
                              }))
                            }
                            className="h-10 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none"
                          >
                            <option value="user">user</option>
                            <option value="support">support</option>
                            <option value="admin">admin</option>
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              moderateUser(user.uid, "set-role", roleDrafts[user.uid] || user.role)
                            }
                            className="graphik rounded-md border border-b-grey px-3 py-2 text-xs uppercase tracking-[0.18em] text-p-white"
                          >
                            Set role
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          moderateUser(user.uid, user.status === "banned" ? "unban" : "ban")
                        }
                        className="graphik rounded-md border border-b-grey px-3 py-2 text-xs uppercase tracking-[0.18em] text-p-white"
                      >
                        {user.status === "banned" ? "Unban" : "Ban"}
                      </button>

                      <button
                        type="button"
                        onClick={() => moderateUser(user.uid, "delete")}
                        className="graphik rounded-md border border-[#ff6b57]/50 px-3 py-2 text-xs uppercase tracking-[0.18em] text-[#ff9789]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {isAdmin && (
            <section className="rounded-2xl border border-b-grey bg-review-bg/70 p-6">
              <SectionHeader eyebrow="Blacklist" title="Block registration by email" />

              <form onSubmit={addBlacklist} className="grid gap-4 md:grid-cols-[1fr_1.2fr_auto]">
                <input
                  type="email"
                  value={blacklistForm.email}
                  onChange={(event) =>
                    setBlacklistForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="Email"
                  className="h-11 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
                <input
                  value={blacklistForm.reason}
                  onChange={(event) =>
                    setBlacklistForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="Reason"
                  className="h-11 rounded-md border border-b-grey bg-input-bg px-3 text-p-white outline-none focus:border-hov-blue"
                />
                <button
                  type="submit"
                  className="graphik rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
                >
                  Add
                </button>
              </form>

              <div className="mt-6 space-y-3">
                {blacklist.map((item) => (
                  <div
                    key={item.emailKey}
                    className="flex flex-col gap-3 rounded-xl border border-b-grey bg-b-blue/40 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-p-white">{item.email}</p>
                      <p className="text-sm text-sh-grey">{item.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlacklist(item.emailKey)}
                      className="graphik rounded-md border border-b-grey px-3 py-2 text-xs uppercase tracking-[0.18em] text-p-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
