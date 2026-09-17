import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/generic/ThemeProvider";
import ThemeToggle from "@/components/generic/ThemeToggle";
import { auth } from "@/auth";
import SessionMonitor from "@/components/auth/SessionMonitor";
import QueryProvider from "@/components/generic/QueryProvider";
import { Toaster } from "sonner";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Social Work Nigeria",
  description:
    "Professional Training & CPD for Social Work Practice in Nigeria",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${roboto.className} antialiased`}>
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
