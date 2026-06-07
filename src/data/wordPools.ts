export const wordPools = {
  short: ["rue", "gare", "nuit", "taxi", "cri", "lune", "brume", "pont", "quai", "feu", "bus", "hall", "zone", "drame", "fuite", "angle", "pavé", "géant", "balai", "zombie", "toit", "rame", "voie", "dock", "cour", "abri", "ombre", "orage", "porte", "crâne"],
  medium: ["néon", "danger", "métro", "spectre", "vitesse", "sirène", "passage", "caveau", "alarme", "verrou", "station", "couloir", "panique", "silence", "tunnel", "façade", "impasse", "parking", "éclair", "charbon", "vapeur", "câble", "machine", "antenne", "frisson", "carnage", "cortège", "épave", "rempart", "fumée"],
  long: ["créature", "poursuite", "catastrophe", "apparition", "malédiction", "téléphone", "laboratoire", "cimetière", "hurlement", "souvenir", "interdit", "minuit", "éléphant", "guimauve", "souterrain", "funiculaire", "incendiaire", "cicatrice", "sentinelle", "funérailles", "désolation", "réverbère", "détonation", "ascenseur", "métallique", "vertigineux"],
  boss: ["apparition", "malédiction", "catastrophe", "cauchemar", "contamination", "possession", "disparition", "exorcisme", "commissariat", "crépuscule", "mastodontesque", "pyrotechnie", "arabesque", "apocalypse", "abomination", "anéantissement", "désintégration", "cataclysme", "nécropole", "condamnation", "incantation", "effondrement", "transfiguration"],
} as const;

export type WordDifficulty = keyof typeof wordPools;
