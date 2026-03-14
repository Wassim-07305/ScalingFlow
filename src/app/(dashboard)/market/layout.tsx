import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Étude de marché",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
