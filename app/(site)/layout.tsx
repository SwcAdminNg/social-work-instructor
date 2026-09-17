import Navbar from "@/components/generic/essentials/Navbar";
import Footer from "@/components/generic/essentials/Footer";
import { auth } from "@/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[999] focus:bg-white focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      <Navbar isLoggedIn={!!session} />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}
