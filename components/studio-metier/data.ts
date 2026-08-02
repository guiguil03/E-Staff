import type { ComponentType } from "react";
import {
  HeadsetIcon,
  TargetIcon,
  HandshakeIcon,
  EnvelopeIcon,
  ChatBubblesIcon,
  MicrophoneIcon,
  MegaphoneIcon,
  ClockIcon,
  DevicePhoneIcon,
  PenIcon,
} from "@/components/studio-metier/MetierIcons";

export interface Metier {
  /** Slug passed to RegistrationForm as `segment`. */
  slug: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export const LONG_TERM_METIERS: Metier[] = [
  {
    slug: "teleconseiller",
    title: "Téléconseiller",
    description:
      "Vous maîtrisez l'art de l'écoute ? Prenez en charge la gestion des flux avec une aisance verbale irréprochable.",
    icon: HeadsetIcon,
  },
  {
    slug: "setter",
    title: "Setter",
    description:
      "Vous avez le sens du contact et un tempérament de prospecteur ? Spécialisez-vous dans l'approche ciblée.",
    icon: TargetIcon,
  },
  {
    slug: "closer",
    title: "Closer",
    description:
      "Vous possédez l'étoffe d'un fin négociateur ? Prenez le relais pour mener à bien les signatures de contrats.",
    icon: HandshakeIcon,
  },
  {
    slug: "agent-emailing",
    title: "Agent Support Émailing",
    description:
      "Vous brillez par votre rigueur écrite et votre rapidité ? Prenez en charge le traitement des requêtes.",
    icon: EnvelopeIcon,
  },
  {
    slug: "conseiller-chat",
    title: "Conseiller Chat / Support Digital",
    description:
      "Vous aimez le dynamisme des échanges en direct ? Intervenez en temps réel sur les plateformes de messagerie.",
    icon: ChatBubblesIcon,
  },
];

export const SHORT_TERM_METIERS: Metier[] = [
  {
    slug: "voix-off",
    title: "Voix Off & Habillage Sonore",
    description:
      "Vous avez une voix magnétique et une diction parfaite ? Prêtez votre voix pour captiver votre auditoire.",
    icon: MicrophoneIcon,
  },
  {
    slug: "community-manager",
    title: "Community Manager",
    description:
      "Vous savez fédérer et créer de l'engagement ? Animez et faites croître la présence des marques avec créativité.",
    icon: MegaphoneIcon,
  },
  {
    slug: "teleconseiller-campagne-courte",
    title: "Téléconseiller (Campagne Courte)",
    description:
      "Vous aimez relever des défis rythmés sur des durées resserrées ? Intervenez sur des opérations ponctuelles.",
    icon: ClockIcon,
  },
  {
    slug: "setter-prospection-digitale",
    title: "Setter & Prospection Digitale",
    description:
      "Vous maniez la prospection numérique avec brio ? Initiez des contacts qualifiés lors de sprints courts.",
    icon: DevicePhoneIcon,
  },
  {
    slug: "redacteur-web",
    title: "Rédacteur Web & Stratégie d'Écriture",
    description:
      "Vous avez la plume affûtée et percutante ? Créez des contenus textuels à forte valeur ajoutée.",
    icon: PenIcon,
  },
];

export const ALL_METIERS: Metier[] = [...LONG_TERM_METIERS, ...SHORT_TERM_METIERS];
