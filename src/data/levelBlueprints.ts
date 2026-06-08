import type { EnemyArchetype, LevelEnvironment, LevelTheme } from "../simulation/types";
import type { MusicKey } from "./music";
import type { WordDifficulty } from "./wordPools";

export type LabelOffset = { x: number; y: number };

export interface EnemyBlueprint {
  archetype: EnemyArchetype;
  pools: WordDifficulty[];
  wordCount: number;
  distance: number;
  lane: number;
  labelOffset?: LabelOffset;
  labelScreenOffset?: LabelOffset;
}

export interface WaveBlueprint {
  label: string;
  travelMs: number;
  difficulty: { min: number; max: number };
  enemies: EnemyBlueprint[];
}

export interface LevelBlueprint {
  id: string;
  title: string;
  subtitle: string;
  briefing: string;
  threat: string;
  music: MusicKey;
  environment: LevelEnvironment;
  theme: LevelTheme;
  waves: WaveBlueprint[];
}

export const levels: LevelBlueprint[] = [
  { id: "brumes", title: "Rue des Brumes", subtitle: "Progression classique du vertical slice", briefing: "Les vitrines respirent encore. Les premiers morts avancent lentement, comme s'ils apprenaient votre rythme.", threat: "Apprentissage: walkers lents et boss isolé", music: "brumes", environment: "street", theme: {
    id: "brumes",
    background: 0x141a2f,
    fog: 0x141a2f,
    fogNear: 38,
    fogFar: 118,
    ground: 0x626d87,
    buildings: 0x59657f,
    ambientLight: 0x95a8d8,
    ambientIntensity: 1.05,
    hemisphereSky: 0xa7b9ff,
    hemisphereGround: 0x1b1d2d,
    hemisphereIntensity: 3.45,
    playerLight: 0xb7d9ff,
    playerLightIntensity: 34,
    neonPrimary: 0xff2d72,
    neonPrimaryIntensity: 46,
    neonSecondary: 0x36c7ff,
    neonSecondaryIntensity: 44,
    signPrimary: 0x35c8ff,
    signSecondary: 0xff2d72,
    streetLightIntensity: 12,
    exposure: 1.72,
  }, waves: [
    { label: "RUE DES BRUMES", travelMs: 1100, difficulty: { min: 11, max: 18 }, enemies: [
      { archetype: "walker", pools: ["short"], wordCount: 1, distance: 28, lane: -1.55, labelOffset: { x: -.08, y: .15 }, labelScreenOffset: { x: -58, y: 18 } },
      { archetype: "walker", pools: ["short"], wordCount: 1, distance: 36, lane: 1.55, labelOffset: { x: .1, y: .2 }, labelScreenOffset: { x: 68, y: 4 } },
      { archetype: "walker", pools: ["short"], wordCount: 1, distance: 45, lane: 0, labelOffset: { x: 0, y: .25 }, labelScreenOffset: { x: 0, y: -46 } },
    ] },
    { label: "CARREFOUR NÉON", travelMs: 1700, difficulty: { min: 26, max: 38 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 36, lane: -1.75, labelOffset: { x: -.12, y: .3 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 31, lane: 1.65, labelOffset: { x: .1, y: .25 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 47, lane: -.25, labelOffset: { x: -.04, y: .55 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 60, lane: 1.95, labelOffset: { x: .08, y: .55 } },
    ] },
    { label: "BOULEVARD DES OMBRES", travelMs: 1950, difficulty: { min: 42, max: 66 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 34, lane: -1.75, labelOffset: { x: -.18, y: .24 }, labelScreenOffset: { x: -86, y: 14 } },
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 43, lane: 1.55, labelOffset: { x: .1, y: .26 }, labelScreenOffset: { x: 82, y: 10 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 57, lane: -.2, labelOffset: { x: -1.05, y: .15 }, labelScreenOffset: { x: -44, y: -38 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 70, lane: 1.85, labelOffset: { x: 1.1, y: .2 }, labelScreenOffset: { x: 110, y: 24 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 83, lane: -1.35, labelOffset: { x: -1.2, y: .5 }, labelScreenOffset: { x: -74, y: 40 } },
    ] },
    { label: "PLACE DU SILENCE", travelMs: 1800, difficulty: { min: 42, max: 58 }, enemies: [
      { archetype: "brute", pools: ["long", "medium"], wordCount: 2, distance: 45, lane: -.25, labelOffset: { x: 1.05, y: 0 }, labelScreenOffset: { x: 20, y: -48 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 31, lane: -1.75, labelOffset: { x: -1.15, y: .15 }, labelScreenOffset: { x: -90, y: 14 } },
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 66, lane: 1.75, labelOffset: { x: 1.35, y: .75 }, labelScreenOffset: { x: 170, y: 30 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 84, lane: -.85, labelOffset: { x: -1.25, y: .25 }, labelScreenOffset: { x: -45, y: 46 } },
    ] },
    { label: "PARVIS DES LANTERNES", travelMs: 2050, difficulty: { min: 54, max: 82 }, enemies: [
      { archetype: "brute", pools: ["long"], wordCount: 2, distance: 40, lane: -.65, labelOffset: { x: -1.05, y: .08 }, labelScreenOffset: { x: -58, y: -42 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 32, lane: -1.9, labelOffset: { x: -1.08, y: .2 }, labelScreenOffset: { x: -112, y: 18 } },
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 53, lane: 1.75, labelOffset: { x: 1.1, y: .35 }, labelScreenOffset: { x: 118, y: 18 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 72, lane: .45, labelOffset: { x: 1.08, y: .1 }, labelScreenOffset: { x: 76, y: -38 } },
    ] },
    { label: "LE TERMINUS", travelMs: 2200, difficulty: { min: 48, max: 68 }, enemies: [
      { archetype: "boss", pools: ["boss", "long"], wordCount: 4, distance: 20, lane: 0, labelOffset: { x: 0, y: .15 } },
    ] },
  ] },
  { id: "station", title: "Station Souterraine", subtitle: "Runners précoces, groupes serrés et boss plus verbeux", briefing: "Sous la ville, les tunnels répondent à chaque frappe. Les runners surgissent tôt et les quais resserrent les trajectoires.", threat: "Pression: runners précoces et groupes serrés", music: "station", environment: "station", theme: {
    id: "station",
    background: 0x0c1b20,
    fog: 0x0c1b20,
    fogNear: 30,
    fogFar: 92,
    ground: 0x536f6d,
    buildings: 0x49696d,
    ambientLight: 0xa3e5d6,
    ambientIntensity: .9,
    hemisphereSky: 0x8bd9c7,
    hemisphereGround: 0x101f1f,
    hemisphereIntensity: 2.9,
    playerLight: 0x9ef4dd,
    playerLightIntensity: 30,
    neonPrimary: 0xf3cf5a,
    neonPrimaryIntensity: 42,
    neonSecondary: 0x25f0d0,
    neonSecondaryIntensity: 48,
    signPrimary: 0x25f0d0,
    signSecondary: 0xf3cf5a,
    streetLightIntensity: 11,
    exposure: 1.58,
  }, waves: [
    { label: "QUAIS FANTÔMES", travelMs: 1000, difficulty: { min: 24, max: 36 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 30, lane: -1.55, labelOffset: { x: -.1, y: .25 }, labelScreenOffset: { x: -60, y: 12 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 38, lane: 1.55, labelOffset: { x: .08, y: .2 }, labelScreenOffset: { x: 74, y: 6 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 49, lane: -.15, labelOffset: { x: -.06, y: .55 } },
      { archetype: "walker", pools: ["short"], wordCount: 1, distance: 58, lane: 1.95, labelOffset: { x: .08, y: .5 } },
    ] },
    { label: "BILLETTERIE NOIRE", travelMs: 1450, difficulty: { min: 40, max: 62 }, enemies: [
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 31, lane: -1.55, labelOffset: { x: -.1, y: .22 }, labelScreenOffset: { x: -70, y: 12 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 35, lane: 1.75, labelOffset: { x: .12, y: .22 }, labelScreenOffset: { x: 96, y: 12 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 52, lane: -.25, labelOffset: { x: -1.05, y: .18 }, labelScreenOffset: { x: -56, y: -36 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 67, lane: -1.85, labelOffset: { x: -1.08, y: .22 }, labelScreenOffset: { x: -90, y: 30 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 82, lane: 1.35, labelOffset: { x: 1.16, y: .45 }, labelScreenOffset: { x: 84, y: 36 } },
    ] },
    { label: "COULOIR DE SERVICE", travelMs: 1500, difficulty: { min: 38, max: 55 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 28, lane: -1.85, labelOffset: { x: -.18, y: .2 }, labelScreenOffset: { x: -90, y: 18 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 37, lane: 1.65, labelOffset: { x: .12, y: .24 }, labelScreenOffset: { x: 84, y: 12 } },
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 49, lane: 0, labelOffset: { x: 0, y: .5 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 64, lane: -.55, labelOffset: { x: -1.1, y: .2 }, labelScreenOffset: { x: -58, y: -34 } },
      { archetype: "walker", pools: ["short"], wordCount: 1, distance: 78, lane: 1.9, labelOffset: { x: .14, y: .55 } },
    ] },
    { label: "SALLE DES MACHINES", travelMs: 1800, difficulty: { min: 62, max: 82 }, enemies: [
      { archetype: "brute", pools: ["long"], wordCount: 2, distance: 42, lane: -.25, labelOffset: { x: 1.05, y: 0 }, labelScreenOffset: { x: 28, y: -48 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 30, lane: -1.85, labelOffset: { x: -1.1, y: .15 }, labelScreenOffset: { x: -100, y: 16 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 52, lane: 1.75, labelOffset: { x: 1.1, y: .2 }, labelScreenOffset: { x: 115, y: 18 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 76, lane: .65, labelOffset: { x: 1.2, y: .15 }, labelScreenOffset: { x: 84, y: -36 } },
      { archetype: "walker", pools: ["medium"], wordCount: 1, distance: 92, lane: -1.65, labelOffset: { x: -1.25, y: .6 }, labelScreenOffset: { x: -82, y: 42 } },
    ] },
    { label: "VOIES SANS RETOUR", travelMs: 2050, difficulty: { min: 78, max: 112 }, enemies: [
      { archetype: "brute", pools: ["long"], wordCount: 2, distance: 36, lane: -.55, labelOffset: { x: -1.08, y: .08 }, labelScreenOffset: { x: -64, y: -44 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 27, lane: -1.95, labelOffset: { x: -1.1, y: .18 }, labelScreenOffset: { x: -112, y: 16 } },
      { archetype: "runner", pools: ["medium", "long"], wordCount: 1, distance: 44, lane: 1.85, labelOffset: { x: 1.1, y: .2 }, labelScreenOffset: { x: 112, y: 16 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 62, lane: .55, labelOffset: { x: 1.15, y: .12 }, labelScreenOffset: { x: 86, y: -38 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 78, lane: -1.15, labelOffset: { x: -1.16, y: .24 }, labelScreenOffset: { x: -74, y: 42 } },
      { archetype: "walker", pools: ["medium"], wordCount: 1, distance: 94, lane: 1.35, labelOffset: { x: 1.18, y: .55 }, labelScreenOffset: { x: 92, y: 42 } },
    ] },
    { label: "DERNIER MÉTRO", travelMs: 2100, difficulty: { min: 62, max: 90 }, enemies: [
      { archetype: "boss", pools: ["boss", "long"], wordCount: 5, distance: 21, lane: 0, labelOffset: { x: 0, y: .15 } },
    ] },
  ] },
  { id: "toits", title: "Toits Orageux", subtitle: "Ambiance violette, distances courtes et pression constante", briefing: "La ville est en dessous, mais le ciel n'offre aucun refuge. Les ennemis arrivent plus près, plus vite, sous les enseignes violettes.", threat: "Survie: distances courtes et brutes multiples", music: "toits", environment: "rooftop", theme: {
    id: "toits",
    background: 0x170f2c,
    fog: 0x24133b,
    fogNear: 24,
    fogFar: 82,
    ground: 0x4d4a62,
    buildings: 0x342d4d,
    ambientLight: 0xc9a5ff,
    ambientIntensity: 1.15,
    hemisphereSky: 0xd9b7ff,
    hemisphereGround: 0x151027,
    hemisphereIntensity: 3.25,
    playerLight: 0xffd6a0,
    playerLightIntensity: 32,
    neonPrimary: 0xff8a2a,
    neonPrimaryIntensity: 50,
    neonSecondary: 0xa45cff,
    neonSecondaryIntensity: 52,
    signPrimary: 0xff8a2a,
    signSecondary: 0xa45cff,
    streetLightIntensity: 13,
    exposure: 1.68,
  }, waves: [
    { label: "ESCALIERS DE SECOURS", travelMs: 950, difficulty: { min: 28, max: 48 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 27, lane: -1.65, labelOffset: { x: -.14, y: .22 }, labelScreenOffset: { x: -76, y: 16 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 35, lane: 1.45, labelOffset: { x: .08, y: .22 }, labelScreenOffset: { x: 72, y: 8 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 43, lane: -.15, labelOffset: { x: -.04, y: .52 } },
      { archetype: "walker", pools: ["short"], wordCount: 1, distance: 54, lane: 1.9, labelOffset: { x: .12, y: .5 } },
    ] },
    { label: "PASSERELLES HAUTES", travelMs: 1350, difficulty: { min: 44, max: 68 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 25, lane: -1.8, labelOffset: { x: -.16, y: .2 }, labelScreenOffset: { x: -96, y: 14 } },
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 33, lane: 1.55, labelOffset: { x: .1, y: .24 }, labelScreenOffset: { x: 84, y: 10 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 43, lane: .05, labelOffset: { x: .02, y: .52 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 59, lane: -.65, labelOffset: { x: -1.08, y: .12 }, labelScreenOffset: { x: -72, y: -38 } },
      { archetype: "walker", pools: ["short", "medium"], wordCount: 1, distance: 75, lane: 1.9, labelOffset: { x: 1.12, y: .48 }, labelScreenOffset: { x: 104, y: 36 } },
    ] },
    { label: "TOITS AU NÉON", travelMs: 1300, difficulty: { min: 48, max: 70 }, enemies: [
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 26, lane: -1.85, labelOffset: { x: -.18, y: .2 }, labelScreenOffset: { x: -96, y: 16 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 34, lane: 1.75, labelOffset: { x: .12, y: .24 }, labelScreenOffset: { x: 92, y: 12 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 50, lane: -.35, labelOffset: { x: -1.05, y: .18 }, labelScreenOffset: { x: -54, y: -38 } },
      { archetype: "walker", pools: ["medium", "short"], wordCount: 1, distance: 66, lane: 1.95, labelOffset: { x: .12, y: .55 }, labelScreenOffset: { x: 104, y: 22 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 77, lane: -.95, labelOffset: { x: -1.16, y: .2 }, labelScreenOffset: { x: -74, y: 30 } },
    ] },
    { label: "ANTENNES HURLANTES", travelMs: 1650, difficulty: { min: 72, max: 98 }, enemies: [
      { archetype: "brute", pools: ["long"], wordCount: 2, distance: 38, lane: -.2, labelOffset: { x: 1.05, y: 0 }, labelScreenOffset: { x: 28, y: -50 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 29, lane: -1.85, labelOffset: { x: -1.1, y: .15 }, labelScreenOffset: { x: -102, y: 14 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 45, lane: 1.65, labelOffset: { x: 1.1, y: .18 }, labelScreenOffset: { x: 108, y: 18 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 63, lane: .55, labelOffset: { x: 1.15, y: .12 }, labelScreenOffset: { x: 80, y: -38 } },
      { archetype: "walker", pools: ["medium"], wordCount: 1, distance: 80, lane: -1.55, labelOffset: { x: -1.22, y: .58 }, labelScreenOffset: { x: -82, y: 42 } },
      { archetype: "runner", pools: ["medium", "long"], wordCount: 1, distance: 92, lane: 1.35, labelOffset: { x: 1.16, y: .32 }, labelScreenOffset: { x: 92, y: 42 } },
    ] },
    { label: "ORAGE AU SOMMET", travelMs: 2150, difficulty: { min: 86, max: 124 }, enemies: [
      { archetype: "brute", pools: ["long"], wordCount: 2, distance: 35, lane: -.75, labelOffset: { x: -1.1, y: .04 }, labelScreenOffset: { x: -76, y: -48 } },
      { archetype: "runner", pools: ["medium", "long"], wordCount: 1, distance: 26, lane: -1.95, labelOffset: { x: -1.1, y: .16 }, labelScreenOffset: { x: -116, y: 14 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 39, lane: 1.9, labelOffset: { x: 1.1, y: .2 }, labelScreenOffset: { x: 112, y: 18 } },
      { archetype: "brute", pools: ["medium", "long"], wordCount: 2, distance: 58, lane: .55, labelOffset: { x: 1.14, y: .1 }, labelScreenOffset: { x: 88, y: -38 } },
      { archetype: "runner", pools: ["medium"], wordCount: 1, distance: 73, lane: -1.25, labelOffset: { x: -1.16, y: .24 }, labelScreenOffset: { x: -78, y: 42 } },
      { archetype: "brute", pools: ["long"], wordCount: 2, distance: 92, lane: 1.1, labelOffset: { x: 1.18, y: .08 }, labelScreenOffset: { x: 102, y: -30 } },
    ] },
    { label: "COURONNE D'ORAGE", travelMs: 2050, difficulty: { min: 68, max: 104 }, enemies: [
      { archetype: "boss", pools: ["boss", "long"], wordCount: 6, distance: 20, lane: 0, labelOffset: { x: 0, y: .15 } },
    ] },
  ] },
  { id: "armaggedon", title: "Armaggedon", subtitle: "Final boss: garde renforcée puis double boss", briefing: "La rue s'ouvre en arène. Les colosses gardent le seuil, puis la ville envoie ses derniers noms contre vous.", threat: "Final: brutes multiples, puis 2 boss à 5 mots", music: "armaggedon", environment: "arena", theme: {
    id: "armaggedon",
    background: 0x12070b,
    fog: 0x2b070c,
    fogNear: 22,
    fogFar: 76,
    ground: 0x553838,
    buildings: 0x3b1b22,
    ambientLight: 0xffa070,
    ambientIntensity: 1.22,
    hemisphereSky: 0xffb15f,
    hemisphereGround: 0x21080c,
    hemisphereIntensity: 3.65,
    playerLight: 0xfff0b0,
    playerLightIntensity: 38,
    neonPrimary: 0xff2b22,
    neonPrimaryIntensity: 58,
    neonSecondary: 0xffb000,
    neonSecondaryIntensity: 55,
    signPrimary: 0xffb000,
    signSecondary: 0xff2b22,
    streetLightIntensity: 16,
    exposure: 1.8,
  }, waves: [
    { label: "LES DEUX COLOSSES", travelMs: 1500, difficulty: { min: 70, max: 116 }, enemies: [
      { archetype: "brute", pools: ["long", "boss"], wordCount: 3, distance: 34, lane: -1.25, labelOffset: { x: -1.15, y: .05 }, labelScreenOffset: { x: -92, y: -38 } },
      { archetype: "brute", pools: ["long", "boss"], wordCount: 3, distance: 44, lane: 1.25, labelOffset: { x: 1.15, y: .05 }, labelScreenOffset: { x: 92, y: -38 } },
    ] },
    { label: "GARDE DE CENDRES", travelMs: 1800, difficulty: { min: 104, max: 168 }, enemies: [
      { archetype: "brute", pools: ["long", "boss"], wordCount: 4, distance: 31, lane: -1.35, labelOffset: { x: -1.18, y: .08 }, labelScreenOffset: { x: -112, y: -42 } },
      { archetype: "brute", pools: ["long", "boss"], wordCount: 4, distance: 42, lane: 0, labelOffset: { x: 0, y: .15 }, labelScreenOffset: { x: 0, y: -50 } },
      { archetype: "brute", pools: ["long", "boss"], wordCount: 4, distance: 53, lane: 1.35, labelOffset: { x: 1.18, y: .08 }, labelScreenOffset: { x: 112, y: -42 } },
    ] },
    { label: "ARMAGGEDON", travelMs: 2400, difficulty: { min: 122, max: 176 }, enemies: [
      { archetype: "boss", pools: ["boss", "long"], wordCount: 5, distance: 23, lane: -1.25, labelOffset: { x: -1.05, y: .1 }, labelScreenOffset: { x: -130, y: -36 } },
      { archetype: "boss", pools: ["boss", "long"], wordCount: 5, distance: 34, lane: 1.25, labelOffset: { x: 1.05, y: .1 }, labelScreenOffset: { x: 130, y: -36 } },
    ] },
  ] },
];

export const defaultLevelId = levels[0].id;
