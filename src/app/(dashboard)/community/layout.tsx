import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communaute",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
