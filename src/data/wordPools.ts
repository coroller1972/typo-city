export const wordPools = {
  short: [
    "rue", "gare", "nuit", "taxi", "cri", "lune", "brume", "pont", "quai", "feu",
    "bus", "hall", "zone", "drame", "fuite", "angle", "pavé", "géant", "balai", "zombie",
    "toit", "rame", "voie", "dock", "cour", "abri", "ombre", "orage", "porte", "crâne",
    "mur", "clé", "sang", "cave", "tram", "borne", "ruine", "fosse", "croix", "piège",
    "rampe", "grue", "train", "urne", "banc", "sort", "vase", "poste", "sable", "givre",
    "égout", "cœur", "trace", "tache", "vitre", "linge", "sueur", "béton", "flamme", "dalle",
  ],
  medium: [
    "néon", "danger", "métro", "spectre", "vitesse", "sirène", "passage", "caveau", "alarme", "verrou",
    "station", "couloir", "panique", "silence", "tunnel", "façade", "impasse", "parking", "éclair", "charbon",
    "vapeur", "câble", "machine", "antenne", "frisson", "carnage", "cortège", "épave", "rempart", "fumée",
    "morsure", "lanterne", "barricade", "horloge", "vestige", "menace", "fissure", "chapelle", "fracture", "bitume",
    "mirage", "étincelle", "patrouille", "refuge", "plaque", "torche", "citerne", "grillage", "carrefour", "malaise",
    "gravats", "cadenas", "cloche", "fumoir", "cellule", "stationnement", "corniche", "escalier", "marquise", "fléau",
  ],
  long: [
    "créature", "poursuite", "catastrophe", "apparition", "malédiction", "téléphone", "laboratoire", "cimetière", "hurlement", "souvenir",
    "interdit", "minuit", "éléphant", "guimauve", "souterrain", "funiculaire", "incendiaire", "cicatrice", "sentinelle", "funérailles",
    "désolation", "réverbère", "détonation", "ascenseur", "métallique", "vertigineux", "ambulance", "brouillard", "catacombes", "mécanisme",
    "silhouette", "sacrilège", "électrique", "projection", "oppression", "contrejour", "basilique", "sépulture", "signalement", "incinérateur",
    "hypnotique", "souterraine", "crépitement", "inquiétude", "décharge", "périphérie", "effraction", "désaccordé", "noctambule", "obscurité",
    "ferrailleur", "condensateur", "interférence", "vrombissement", "cérémonie", "déraillement",
  ],
  boss: [
    "apparition", "malédiction", "catastrophe", "cauchemar", "contamination", "possession", "disparition", "exorcisme", "commissariat", "crépuscule",
    "mastodontesque", "pyrotechnie", "arabesque", "apocalypse", "abomination", "anéantissement", "désintégration", "cataclysme", "nécropole", "condamnation",
    "incantation", "effondrement", "transfiguration", "putréfaction", "nécromancie", "décomposition", "hallucination", "profanation", "déflagration", "engloutissement",
    "métamorphose", "désincarnation", "sarcophage", "thaumaturgie", "conjuration", "épouvantable", "maléfice", "subjugation", "réanimation", "monstruosité",
    "désenchantement", "sépulcral", "occultation", "pétrification", "damnation", "carnassier", "hydromancie", "pandémonium",
  ],
} as const;

export type WordDifficulty = keyof typeof wordPools;
