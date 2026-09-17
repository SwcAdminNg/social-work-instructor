import { redirect } from "next/navigation";

export default async function LegacyInstructorCompleteSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  redirect(`/complete-setup${query}`);
}
