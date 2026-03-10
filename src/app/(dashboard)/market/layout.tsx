import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Etude de marche",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
