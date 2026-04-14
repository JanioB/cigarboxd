import { redirect } from "next/navigation";

export default async function ResultsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ searchTerm?: string }>;
}) {
  const params = await searchParams;
  const searchTerm = params.searchTerm || "";
  redirect(`/cigarettes?search=${encodeURIComponent(searchTerm)}`);
}
