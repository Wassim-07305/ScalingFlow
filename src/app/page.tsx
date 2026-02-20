import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold font-[family-name:var(--font-display)] neon-text-gradient">
          ScalingFlow
        </h1>
        <p className="text-text-secondary text-lg max-w-md">
          Infrastructure IA Plug &amp; Play pour scaler ton business.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-[var(--radius-md)] bg-neon-orange text-white font-semibold neon-glow-orange transition-all duration-300 hover:brightness-110 cursor-pointer"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-block px-6 py-3 rounded-[var(--radius-md)] border border-neon-blue text-neon-blue font-semibold transition-all duration-300 hover:bg-neon-blue-glow cursor-pointer"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </main>
  );
}
