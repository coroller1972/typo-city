export { wordPools as words, type WordDifficulty } from "../data/wordPools";
export function normalizeKey(value: string): string { return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase(); }
export function sameKey(left: string, right: string): boolean { return normalizeKey(left) === normalizeKey(right); }
