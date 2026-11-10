import type { Metadata } from "next";

/** Facts about the instructor site, used for metadata and structured data. */
export const site = {
  name: "Social Work Nigeria Instructors",
  shortName: "SWN Instructors",
  organisation: "Social Work Consultancy Ltd",
  description:
    "The instructor platform of Social Work Consultancy Ltd: build, submit and teach practice-led social work courses for learners in Nigeria and beyond.",
  /** Set NEXT_PUBLIC_BASE_URL to the live origin in each environment. */
  url: (process.env.NEXT_PUBLIC_BASE_URL || "https://socialworknigeria.org").replace(/\/$/, ""),
  email: "support@socialworknigeria.org",
  phone: "+234 803 447 1063",
  locale: "en_NG",
};

export const absoluteUrl = (path = "/") => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;

export const shareImage = {
  url: "/images/site/share.jpg",
  width: 1200,
  height: 630,
  alt: "An instructor teaches at a whiteboard while two colleagues follow along.",
};

/** Full metadata for a public page: title, description, canonical, Open Graph and Twitter. */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: site.locale,
      url: path,
      title,
      description,
      images: [shareImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage.url] },
  };
}

/** JSON-LD for a page, linked to the site's organisation and website nodes. */
export function pageJsonLd({
  type = "WebPage",
  path,
  name,
  description,
  crumbs = [],
  extra = [],
  mainEntity,
}: {
  type?: string;
  path: string;
  name: string;
  description: string;
  crumbs?: { name: string; path: string }[];
  extra?: Record<string, unknown>[];
  /** Placed on the page node, e.g. the questions of an FAQPage. */
  mainEntity?: unknown[];
}) {
  const url = absoluteUrl(path);
  const trail = [{ name: "Home", path: "/" }, ...crumbs];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.organisation,
        url: site.url,
        email: site.email,
        telephone: site.phone,
        logo: absoluteUrl("/images/logo/swc-logo-on-light.webp"),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": `${site.url}/#organization` },
        inLanguage: "en-NG",
      },
      {
        "@type": type,
        "@id": `${url}#webpage`,
        url,
        name,
        description,
        isPartOf: { "@id": `${site.url}/#website` },
        about: { "@id": `${site.url}/#organization` },
        primaryImageOfPage: absoluteUrl(shareImage.url),
        inLanguage: "en-NG",
        ...(mainEntity && mainEntity.length ? { mainEntity } : {}),
      },
      ...(trail.length > 1
        ? [
            {
              "@type": "BreadcrumbList",
              itemListElement: trail.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: c.name,
                item: absoluteUrl(c.path),
              })),
            },
          ]
        : []),
      ...extra,
    ],
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
