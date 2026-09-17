import { BrandPanel, MobileBrandLogo } from "./BrandPanel";

type AuthVariant = "login" | "register" | "forgot-password" | "reset-password";

export function AuthPageShell({
  children,
  variant = "login",
  statsData,
}: {
  children: React.ReactNode;
  variant?: AuthVariant;
  statsData?: any;
}) {
  return (
    <div className="min-h-screen flex bg-[#f0f7f4] dark:bg-[#0a0a0a]">
      <BrandPanel variant={variant} statsData={statsData} />

      <div className="flex-1 flex items-center justify-center px-5 py-12 sm:px-10 lg:px-14 xl:px-20">
        <div className="w-full max-w-[420px]">
          <MobileBrandLogo />
          {children}
        </div>
      </div>
    </div>
  );
}
