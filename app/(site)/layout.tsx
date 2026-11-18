import SiteHeader from "@/components/swcl/SiteHeader";
import SiteFooter from "@/components/swcl/SiteFooter";
import { siteFonts } from "@/lib/fonts";
import { auth } from "@/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className={`${siteFonts} sw swc`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[2100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-[#0e1f17]"
      >
        Skip to main content
      </a>
      <SiteHeader isLoggedIn={!!session} />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
