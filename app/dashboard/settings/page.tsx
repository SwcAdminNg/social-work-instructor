import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { PasskeySettings } from "@/components/dashboard/PasskeySettings";

export const metadata = {
  title: "Profile Settings | Social Work Nigeria Instructor",
  description: "Manage your instructor profile settings.",
};

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-0 space-y-10">
      <ProfileSettings />
      <PasskeySettings />
    </div>
  );
}
