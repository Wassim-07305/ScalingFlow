import type { Metadata } from "next";

const title = "ScalingFlow — Scale ton business avec l'IA";
const description =
  "La plateforme tout-en-un pour structurer, lancer et scaler ton business. Offres, funnels, ads, contenu — tout généré par l'IA en quelques clics.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: "/welcome",
    siteName: "ScalingFlow",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/icons/icon-1024.png",
        width: 1024,
        height: 1024,
        alt: "ScalingFlow — Scale ton business avec l'IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/icons/icon-1024.png"],
  },
  alternates: {
    canonical: "/welcome",
  },
  keywords: [
    "ScalingFlow",
    "IA",
    "business",
    "scaling",
    "offre",
    "funnel",
    "ads",
    "marketing",
    "SaaS",
    "intelligence artificielle",
  ],
};

export default function WelcomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
