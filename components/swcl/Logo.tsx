import Image from "next/image";
import Link from "next/link";
import { cx } from "./ui";

/**
 * Company logo linking home. `tone="auto"` follows the theme; "dark" is for
 * deep green surfaces.
 */
export default function Logo({
  tone = "auto",
  className,
  priority,
}: {
  tone?: "auto" | "light" | "dark";
  className?: string;
  priority?: boolean;
}) {
  const img = "h-auto w-[140px] md:w-[156px] object-contain";
  return (
    <Link href="/" aria-label="Social Work Consultancy Ltd, instructor site home" className={cx("inline-flex shrink-0 no-underline", className)}>
      {tone !== "dark" && (
        <Image
          src="/images/logo/swc-logo-on-light.webp"
          alt=""
          width={480}
          height={133}
          sizes="160px"
          priority={priority}
          className={cx(img, tone === "auto" && "dark:hidden")}
        />
      )}
      {tone !== "light" && (
        <Image
          src="/images/logo/swc-logo-on-dark.webp"
          alt=""
          width={480}
          height={133}
          sizes="160px"
          priority={priority}
          className={cx(img, tone === "auto" && "hidden dark:block")}
        />
      )}
    </Link>
  );
}
