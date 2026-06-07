export const musicManifest = {
  intro: { title: "Intro", url: "/assets/audio/intro.mp3" },
  brumes: { title: "Trolley Fever", url: "/assets/audio/Rames de Cendres.mp3" },
  station: { title: "Station Fever", url: "/assets/audio/Couronne de Cendres.mp3" },
  toits: { title: "Rooftop Fever", url: "/assets/audio/Couronne de Cendres Remix.mp3" },
  armaggedon: { title: "Armaggedon", url: "/assets/audio/Armaggedon.mp3" },
} as const;

export type MusicKey = keyof typeof musicManifest;
