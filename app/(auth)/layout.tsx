import MotionEngine from "@/components/site/MotionEngine";
import { siteFonts } from "@/lib/fonts";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${siteFonts} sw`}>
      {/* Marks the page before first paint so entry animations never flash. */}
      <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('sw-motion')" }} />
      <MotionEngine />
      {children}
    </div>
  );
}
