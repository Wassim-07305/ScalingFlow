import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activite",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
