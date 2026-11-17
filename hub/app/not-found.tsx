import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h1 className="font-display text-4xl font-extrabold text-primary tnum">404</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Page introuvable. Le protocole n'a pas d'admin, mais il a un plan : revenir au tableau de bord.
      </p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        data-testid="link-back-home"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
