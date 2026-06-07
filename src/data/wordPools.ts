export const wordPools = {
  short: ["rue", "gare", "nuit", "taxi", "cri", "lune", "brume", "pont", "quai", "feu", "bus", "hall", "zone", "drame", "fuite", "angle", "pavée", "géant", "balai", "zombie"],
  medium: ["néon", "danger", "métro", "spectre", "vitesse", "sirène", "passage", "caveau", "alarme", "verrou", "station", "couloir", "panique", "silence", "tunnel", "façade"],
  long: ["créature", "poursuite", "catastrophe", "apparition", "malédiction", "téléphone", "laboratoire", "cimetière", "hurlement", "souvenir", "interdit", "minuit", "éléphant", "guimauve"],
  boss: ["apparition", "malédiction", "catastrophe", "cauchemar", "contamination", "possession", "disparition", "exorcisme", "commissariat", "crépuscule", "mastodontesque", "pyrotechnie", "arabesque", "apocalypse"],
} as const;

export type WordDifficulty = keyof typeof wordPools;
