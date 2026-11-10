import Navbar from "@/components/generic/essentials/Navbar";
import Footer from "@/components/generic/essentials/Footer";
import MotionEngine from "@/components/site/MotionEngine";
import { siteFonts } from "@/lib/fonts";
import { auth } from "@/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className={`${siteFonts} sw`}>
      {/* Marks the page before first paint so entry animations never flash. */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('sw-motion')" }} />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[2100] focus:bg-white focus:text-[#10231a] focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      <MotionEngine />
      <Navbar isLoggedIn={!!session} />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
