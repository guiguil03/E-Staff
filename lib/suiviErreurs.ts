"use client";

// Suivi des erreurs du site (audit du 2026-09-28) — inactif tant que
// NEXT_PUBLIC_SENTRY_DSN n'est pas renseignée sur Vercel. Le SDK Sentry
// n'est téléchargé que dans ce cas (import dynamique) : aucun poids ajouté
// aux pages sinon.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

type SentryModule = typeof import("@sentry/browser");
let sentry: Promise<SentryModule | null> | null = null;

export function initialiserSuiviErreurs(): Promise<SentryModule | null> {
  if (!DSN) return Promise.resolve(null);
  if (!sentry) {
    sentry = import("@sentry/browser")
      .then((S) => {
        // Capture aussi les erreurs JS non gérées et promesses rejetées.
        S.init({ dsn: DSN, environment: process.env.NODE_ENV, tracesSampleRate: 0 });
        return S;
      })
      .catch(() => null);
  }
  return sentry;
}

export function signalerErreur(error: unknown): void {
  void initialiserSuiviErreurs().then((S) => S?.captureException(error));
}
