import { CigaretteCatalogPage } from "../components/Cigarette/CigaretteCatalogPage";

export default async function CigarettesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  return <CigaretteCatalogPage search={params.search || ""} />;
}
