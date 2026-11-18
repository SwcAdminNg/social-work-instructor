import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import { bodyFont, preloadBodyFont } from "@/lib/fonts";
import ThemeProvider from "@/components/generic/ThemeProvider";
import ThemeToggle from "@/components/generic/ThemeToggle";
import { auth } from "@/auth";
import SessionMonitor from "@/components/auth/SessionMonitor";
import QueryProvider from "@/components/generic/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://socialworknigeria.org"),
  title: "Social Work Nigeria Instructors",
  description: "Instructor platform for Social Work Nigeria",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  preloadBodyFont();

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${bodyFont} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <SessionMonitor session={session}>
              {children}
              <ThemeToggle />
              <Toaster richColors position="top-right" />
            </SessionMonitor>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
