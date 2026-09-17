import { fetchApi } from "@/lib/fetchApi";
import CertificatesList, { type Certificate } from "./CertificatesList";

export default async function CertificatesContainer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page =
    typeof resolvedParams.page === "string"
      ? parseInt(resolvedParams.page, 10)
      : 1;

  const limit = 12;

  let certificates: Certificate[] = [];
  let totalItems = 0;
  let error: string | null = null;

  try {
    const res = await fetchApi(
      `/certificates/mine?page=${page}&page_size=${limit}`,
      { next: { revalidate: 0 } },
    );

    if (!res.ok) {
      throw new Error("Failed to fetch certificates");
    }

    const json = await res.json().catch(() => ({}));
    if (json && json.data) {
      certificates = json.data;
      totalItems = json.meta?.total_items || 0;
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "An error occurred while fetching your certificates.";
  }

  return (
    <div className="w-full h-full max-w-8xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Certificates
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Certificates you&apos;ve earned by completing courses. Download the PDF or
          share the verification link with anyone.
        </p>
      </div>

      <CertificatesList
        initialData={certificates}
        totalItems={totalItems}
        currentPage={page}
        limit={limit}
        error={error}
      />
    </div>
  );
}
