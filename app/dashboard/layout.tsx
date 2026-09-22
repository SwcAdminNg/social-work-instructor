import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { fetchApi } from "@/lib/fetchApi";

type DashboardUser = {
  profile_picture_url?: string | null;
};

async function getDashboardUser(): Promise<DashboardUser | null> {
  try {
    const res = await fetchApi("/users/me", { cache: "no-store" });
    if (!res.ok) return null;

    const json = await res.json().catch(() => ({}));
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getDashboardUser();

  return (
    <DashboardShell
      userHasProfilePicture={
        user ? Boolean(user.profile_picture_url) : undefined
      }
    >
      {children}
    </DashboardShell>
  );
}
