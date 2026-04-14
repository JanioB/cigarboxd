import { redirect } from "next/navigation";

export default async function MovieRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/cigarette/${id}`);
}
