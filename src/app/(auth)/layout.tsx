import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi ou cree ton compte ScalingFlow pour acceder a ta plateforme IA.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
