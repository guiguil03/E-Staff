import Link from "next/link";
import Reveal from "@/components/Reveal";
import ReactionButton from "./ReactionButton";
import ShareButton from "./ShareButton";
import { LockIcon, StarIcon, MedalIcon, PlusCircleIcon } from "./CommunityIcons";

type Tone = "success" | "teal" | "accent" | "primary";

interface MediaPost {
  id: string;
  type: "Photo" | "Vidéo";
  caption: string;
  firstname: string;
  tone: Tone;
  reactions: number;
  /** A subset of posts carry the "top performer" ribbon + star rating, like
   * the reference gallery mixes plain team shots with badged portraits. */
  featured?: boolean;
  rating?: number;
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
    featured: true,
    rating: 5,
  },
  {
    id: "p4",
    type: "Photo",
    caption: "Portrait du leader du mois, pôle Talents.",
    firstname: "Njaka",
    tone: "primary",
    reactions: 27,
    featured: true,
    rating: 5,
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
    featured: true,
    rating: 4,
  },
];

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success",
  teal: "bg-teal",
  accent: "bg-accent",
  primary: "bg-primary",
};

function HangingPin() {
  return (
    <div aria-hidden="true" className="mx-auto hidden w-px flex-col items-center sm:flex">
      <span className="h-6 w-px bg-accent/40" />
      <span className="-mt-0.5 h-1.5 w-1.5 rounded-full bg-accent" />
    </div>
  );
}

// The gallery wall + upload panel for /communaute — dark/elite universe
// (obsidian background, gold-framed "hanging photo" cards). Returns content
// only; the page shell supplies the full-bleed obsidian background.
export default function MediaWall() {
  return (
    <div aria-labelledby="mur-performances">
      <Reveal>
        <h2
          id="mur-performances"
          className="font-display text-2xl font-bold text-accent sm:text-3xl"
        >
          Le Mur des Performances &amp; Médias
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-sm text-white/60">
          Photos et vidéos de l&apos;équipe, moments forts des campagnes, portraits de nos
          leaders et de nos formateurs.
        </p>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-4 inline-flex items-center gap-2 rounded border border-accent/25 bg-obsidianCard px-4 py-2 font-sans text-xs text-white/60">
          <LockIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
          Chaque contenu partagé par la communauté passe par une prévisualisation avant
          publication.
        </div>
      </Reveal>

      <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-white/40">
        Exemples illustratifs — à remplacer par de vrais médias
      </p>

      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMPLE_POSTS.map((post, i) => (
          <Reveal key={post.id} delay={i * 60}>
            <div className="flex flex-col items-center">
              <HangingPin />
              <article className="relative mt-1 w-full overflow-hidden rounded-lg border-2 border-accent/60 bg-obsidianCard shadow-lg shadow-black/40">
                {post.featured && (
                  <span className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-accent bg-obsidian/80 text-accent">
                    <MedalIcon className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={`flex h-36 items-center justify-center px-4 text-center ${TONE_CLASSES[post.tone]}`}
                >
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white/85">
                    Exemple — {post.type}
                  </span>
                </div>
                {post.featured && post.rating && (
                  <div className="flex items-center justify-center gap-0.5 border-t border-accent/20 bg-obsidianCard px-4 pt-3">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <StarIcon
                        key={starIndex}
                        filled={starIndex < post.rating!}
                        className={`h-3.5 w-3.5 ${starIndex < post.rating! ? "text-accent" : "text-white/20"}`}
                      />
                    ))}
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <p className="flex-1 font-sans text-sm text-white/85">{post.caption}</p>
                  <p className="mt-3 font-mono text-xs text-white/40">
                    Publié par {post.firstname}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ReactionButton
                      initialCount={post.reactions}
                      label={`Réagir à la publication de ${post.firstname}`}
                    />
                    <Link
                      href="/connexion"
                      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-obsidian/60 px-3 py-1.5 font-sans text-xs font-medium text-white/70 transition-colors duration-150 hover:border-accent hover:text-accent"
                    >
                      <LockIcon className="h-3.5 w-3.5" />
                      Commenter
                    </Link>
                    <ShareButton label={`Partager la publication de ${post.firstname}`} />
                  </div>
                </div>
              </article>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div className="mx-auto mt-14 flex max-w-xl flex-col items-center gap-3 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-white/50">
            Importer vos souvenirs
          </p>
          <div className="relative">
            <button
              type="button"
              disabled
              aria-hidden="true"
              tabIndex={-1}
              className="flex h-16 w-16 cursor-not-allowed items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-accent opacity-70"
            >
              <PlusCircleIcon className="h-8 w-8" />
            </button>
          </div>
          <p className="font-sans text-sm text-white/60">
            Joindre des photos ou vidéos (pour validation)
          </p>
          <p className="font-mono text-xs text-white/40">
            Formats JPG, PNG ou MP4 — sera examiné avant publication.
          </p>

          <div className="relative mt-2 w-full">
            <input
              type="file"
              disabled
              aria-hidden="true"
              tabIndex={-1}
              className="block w-full cursor-not-allowed rounded border border-accent/20 bg-obsidian px-3 py-2 font-sans text-sm text-white/40 opacity-50"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center gap-2 rounded bg-obsidian/80 backdrop-blur-[1px]"
            >
              <LockIcon className="h-4 w-4 text-accent" />
              <span className="font-sans text-xs font-medium text-white/85">
                Connectez-vous pour importer
              </span>
            </div>
          </div>

          <Link
            href="/connexion"
            className="mt-2 inline-flex items-center justify-center rounded-full border border-accent bg-accent px-6 py-2.5 font-sans text-sm font-medium text-obsidian transition-colors duration-150 hover:bg-accent/90"
          >
            Se connecter pour publier
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
