import Link from "next/link";
import Reveal from "@/components/Reveal";
import ReactionButton from "./ReactionButton";
import { LockIcon, UploadIcon } from "./CommunityIcons";

type Tone = "success" | "teal" | "accent" | "primary";

interface MediaPost {
  id: string;
  type: "Photo" | "Vidéo";
  caption: string;
  firstname: string;
  tone: Tone;
  reactions: number;
}

// EXAMPLE content only — there is no real media library yet. These six
// posts stand in for the "real" moderated wall (team moments, campaign
// highlights, leader/teacher portraits) and should be replaced with actual
// approved media once the back-office moderation queue exists.
const EXAMPLE_POSTS: MediaPost[] = [
  {
    id: "p1",
    type: "Photo",
    caption: "Moment d'équipe pendant la campagne du trimestre.",
    firstname: "Fara",
    tone: "success",
    reactions: 24,
  },
  {
    id: "p2",
    type: "Vidéo",
    caption: "Portrait d'un de nos formateurs, en session d'éloquence.",
    firstname: "Mihaja",
    tone: "teal",
    reactions: 18,
  },
  {
    id: "p3",
    type: "Photo",
    caption: "Célébration des objectifs de production atteints.",
    firstname: "Tiana",
    tone: "accent",
    reactions: 31,
  },
  {
    id: "p4",
    type: "Photo",
    caption: "Portrait du leader du mois, pôle Talents.",
    firstname: "Njaka",
    tone: "primary",
    reactions: 27,
  },
  {
    id: "p5",
    type: "Vidéo",
    caption: "Extrait d'une session de coaching oratoire (programme FOL).",
    firstname: "Vola",
    tone: "success",
    reactions: 15,
  },
  {
    id: "p6",
    type: "Photo",
    caption: "Remise des diplômes internes de fin de module.",
    firstname: "Hasina",
    tone: "teal",
    reactions: 22,
  },
];

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success",
  teal: "bg-teal",
  accent: "bg-accent",
  primary: "bg-primary",
};

export default function MediaWall() {
  return (
    <section
      className="bg-background px-4 py-16 sm:px-6 sm:py-20"
      aria-labelledby="mur-performances"
    >
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2
            id="mur-performances"
            className="font-display text-2xl font-bold text-primary sm:text-3xl"
          >
            Le Mur des Performances &amp; Médias
          </h2>
          <p className="mt-2 max-w-2xl font-sans text-sm text-muted">
            Photos et vidéos de l&apos;équipe, moments forts des campagnes, portraits de nos
            leaders et de nos formateurs.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-4 inline-flex items-center gap-2 rounded border border-primary/10 bg-white px-4 py-2 font-sans text-xs text-muted">
            <LockIcon className="h-3.5 w-3.5 shrink-0 text-primary/60" />
            Chaque contenu partagé par la communauté passe par une prévisualisation avant
            publication.
          </div>
        </Reveal>

        <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-muted">
          Exemples illustratifs — à remplacer par de vrais médias
        </p>

        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLE_POSTS.map((post, i) => (
            <Reveal key={post.id} delay={i * 60}>
              <article className="flex h-full flex-col overflow-hidden rounded border border-primary/10 bg-white shadow-sm">
                <div
                  className={`flex h-36 items-center justify-center px-4 text-center ${TONE_CLASSES[post.tone]}`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white/85">
                    Exemple — {post.type}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex-1 font-sans text-sm text-ink">{post.caption}</p>
                  <p className="mt-3 font-mono text-xs text-muted">
                    Publié par {post.firstname}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <ReactionButton
                      initialCount={post.reactions}
                      label={`Réagir à la publication de ${post.firstname}`}
                    />
                    <Link
                      href="/connexion"
                      className="inline-flex items-center gap-1 font-sans text-xs text-muted transition-colors duration-150 hover:text-accent"
                    >
                      <LockIcon className="h-3.5 w-3.5" />
                      Commenter
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mx-auto mt-12 max-w-xl rounded border border-primary/10 bg-white p-6">
            <p className="flex items-center gap-2 font-sans text-sm font-medium text-primary">
              <UploadIcon className="h-4 w-4 text-primary/70" />
              Importer une photo ou une vidéo
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              Formats JPG, PNG ou MP4 — sera examiné avant publication.
            </p>

            <div className="relative mt-4">
              <input
                type="file"
                disabled
                aria-hidden="true"
                tabIndex={-1}
                className="block w-full cursor-not-allowed rounded border border-primary/20 bg-background px-3 py-2 font-sans text-sm text-muted opacity-50"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center gap-2 rounded bg-white/75 backdrop-blur-[1px]"
              >
                <LockIcon className="h-4 w-4 text-primary" />
                <span className="font-sans text-xs font-medium text-primary">
                  Connectez-vous pour importer
                </span>
              </div>
            </div>

            <Link
              href="/connexion"
              className="mt-4 inline-flex items-center justify-center rounded border border-primary bg-primary px-5 py-2 font-sans text-sm font-medium text-white transition-colors duration-150 hover:bg-primary/90"
            >
              Se connecter pour publier
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
