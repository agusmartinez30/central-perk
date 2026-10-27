import { redirect } from "next/navigation";
import { getLegacyQrRedirect } from "@/features/table-management/tables-view";

/**
 * The former "Mesas y códigos QR" screen is now the "Códigos QR" tab of Gestión de mesas:
 * old links (and their `?state=` variants) land there. The page only redirects, so it reads
 * `searchParams` outside `<Suspense>` and opts out of the instant (prerendered) shell.
 */
export const instant = false;

export default async function TableQrPage({ searchParams }: PageProps<"/tables/qr">) {
  const { state } = await searchParams;
  redirect(getLegacyQrRedirect(state));
}
