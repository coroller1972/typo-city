export type EnemyArchetype = "walker" | "runner" | "brute" | "boss";
export type GamePhase = "menu" | "playing" | "paused" | "victory" | "defeat";
export type EnemyStatus = "approaching" | "targeted" | "attacking" | "defeated";
export type InputFeedbackKind = "hit" | "kill" | "error";
export type LevelEnvironment = "street" | "station" | "rooftop" | "arena";
export type DifficultyMode = "easy" | "normal" | "hard" | "nightmare";
export interface LevelTheme {
  id: string;
  background: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  ground: number;
  buildings: number;
  ambientLight: number;
  ambientIntensity: number;
  hemisphereSky: number;
  hemisphereGround: number;
  hemisphereIntensity: number;
  playerLight: number;
  playerLightIntensity: number;
  neonPrimary: number;
  neonPrimaryIntensity: number;
  neonSecondary: number;
  neonSecondaryIntensity: number;
  signPrimary: number;
  signSecondary: number;
  streetLightIntensity: number;
  exposure: number;
}
export interface EnemyState { id: string; archetype: EnemyArchetype; words: string[]; activeWordIndex: number; typedLength: number; distance: number; status: EnemyStatus; lane: number; labelOffset?: { x: number; y: number }; labelScreenOffset?: { x: number; y: number }; }
export interface GameState { phase: GamePhase; lives: number; score: number; combo: number; maxCombo: number; difficulty: DifficultyMode; lockedEnemyId?: string; enemies: EnemyState[]; waveIndex: number; waveLabel: string; levelId: string; levelTitle: string; levelTheme: LevelTheme; levelEnvironment: LevelEnvironment; elapsedMs: number; totalKeys: number; correctKeys: number; errorFlash: number; }
export interface InputFeedback { kind: InputFeedbackKind; enemyId?: string; combo: number; wordComplete?: boolean; }
export interface WaveDefinition { label: string; travelMs: number; enemies: Array<Omit<EnemyState, "id" | "status" | "typedLength" | "activeWordIndex">>; }
