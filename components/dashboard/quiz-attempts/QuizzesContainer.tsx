import { fetchApi } from "@/lib/fetchApi";
import QuizzesList from "./QuizzesList";

export default async function QuizzesContainer({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page =
    typeof resolvedParams.page === "string"
      ? parseInt(resolvedParams.page, 10)
      : 1;
  const status =
    typeof resolvedParams.status === "string" ? resolvedParams.status : null;

  const limit = 20;

  let quizzes = [];
  let totalItems = 0;
  let error = null;

  try {
    let url = `/learning/quizzes/me?page=${page}&page_size=${limit}`;
    if (status && status !== "ALL") {
      url += `&status=${status}`;
    }

    const res = await fetchApi(url, {
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    const json = await res.json().catch(() => ({}));
    if (json && json.data) {
      quizzes = json.data;
      totalItems = json.meta?.total_items || 0;
    }
  } catch (err: any) {
    error = err.message || "An error occurred while fetching your quizzes.";
  }

  return (
    <div className="w-full h-full max-w-8xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quizzes
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Review your quiz attempts, scores, and available knowledge checks.
        </p>
      </div>

      <QuizzesList
        initialData={quizzes}
        totalItems={totalItems}
        currentPage={page}
        currentStatus={status || "ALL"}
        limit={limit}
        error={error}
      />
    </div>
  );
}
