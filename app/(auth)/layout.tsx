import { siteFonts } from "@/lib/fonts";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${siteFonts} sw swc`}>{children}</div>;
}
