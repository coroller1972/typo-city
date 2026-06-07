import { beforeEach, describe, expect, it } from "vitest";
import { TypingGame } from "./game"; import { createLevel, validateLevel, waveDifficultyScore } from "./level"; import { normalizeKey, sameKey } from "./words"; import type { WaveDefinition } from "./types";
import { levels } from "../data/levelBlueprints";
const wave = (word = "néon", distance = 10): WaveDefinition[] => [{ label: "TEST", travelMs: 0, enemies: [{ archetype: "walker", words: [word], distance, lane: 0 }] }];
const store = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", { value: { clear: () => store.clear(), getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => store.set(key, value) } });
beforeEach(() => localStorage.clear());
describe("typing simulation", () => {
  it("normalizes French accents", () => { expect(normalizeKey("Été")).toBe("ete"); expect(sameKey("é", "e")).toBe(true); });
  it("rejects duplicate initials in the same wave", () => { const duplicate = wave("rue"); duplicate[0].enemies.push({ archetype: "walker", words: ["rat"], distance: 20, lane: 2 }); expect(() => validateLevel(duplicate)).toThrow("Duplicate initial"); });
  it("locks a target and accepts an unaccented key", () => { const game = new TypingGame(wave()); game.start(); game.update(600); expect(game.type("n")).toBe("hit"); expect(game.state.lockedEnemyId).toBe("enemy-1"); expect(game.type("e")).toBe("hit"); });
  it("emits consumable input feedback for hits and errors", () => {
    const game = new TypingGame(wave());
    game.start(); game.update(600);
    expect(game.type("n")).toBe("hit");
    expect(game.consumeInputFeedback()).toEqual({ kind: "hit", enemyId: "enemy-1", combo: 1 });
    expect(game.consumeInputFeedback()).toBeUndefined();
    expect(game.type("x")).toBe("error");
    expect(game.consumeInputFeedback()).toEqual({ kind: "error", combo: 0 });
  });
  it("breaks combo on typo", () => { const game = new TypingGame(wave()); game.start(); game.update(600); game.type("n"); expect(game.state.combo).toBe(1); expect(game.type("x")).toBe("error"); expect(game.state.combo).toBe(0); });
  it("damages the player when an enemy reaches them", () => { const game = new TypingGame(wave("rue", .1)); game.start(); game.update(600); game.update(100); expect(game.state.lives).toBe(4); });
  it("keeps normal difficulty as the baseline zombie speed", () => {
    const game = new TypingGame(wave("rue", 10));
    game.setDifficulty("normal");
    game.start(); game.update(600);
    const before = game.state.enemies[0].distance;
    game.update(1000);
    expect(game.state.enemies[0].distance).toBeCloseTo(before - 1.45, 5);
  });
  it("changes zombie approach speed with difficulty mode", () => {
    const easy = new TypingGame(wave("rue", 10));
    const hard = new TypingGame(wave("rue", 10));
    easy.setDifficulty("easy"); hard.setDifficulty("hard");
    easy.start(); hard.start(); easy.update(600); hard.update(600);
    const easyBefore = easy.state.enemies[0].distance;
    const hardBefore = hard.state.enemies[0].distance;
    easy.update(1000); hard.update(1000);
    expect(easy.state.enemies[0].distance).toBeCloseTo(easyBefore - 1.45 * .78, 5);
    expect(hard.state.enemies[0].distance).toBeCloseTo(hardBefore - 1.45 * 1.22, 5);
    expect(hard.state.enemies[0].distance).toBeLessThan(easy.state.enemies[0].distance);
  });
  it("stores the best score after victory", () => { const game = new TypingGame(wave("a")); game.start(); game.update(600); game.type("a"); game.update(16); game.update(600); expect(game.state.phase).toBe("victory"); expect(game.bestScore()).toBeGreaterThan(0); });
  it("generates deterministic valid levels from a seed", () => { const first = createLevel({ seed: 42 }); const second = createLevel({ seed: 42 }); const other = createLevel({ seed: 43 }); expect(first).toEqual(second); expect(first).not.toEqual(other); expect(() => validateLevel(first)).not.toThrow(); });
  it("keeps generated first initials distinct inside each wave", () => { const generated = createLevel({ seed: 7 }); for (const item of generated) expect(new Set(item.enemies.map((enemy) => normalizeKey(enemy.words[0][0]))).size).toBe(item.enemies.length); });
  it("keeps generated wave difficulty inside authored budgets", () => {
    for (const level of levels) {
      const budgets = Object.fromEntries(level.waves.map((wave) => [wave.label, [wave.difficulty.min, wave.difficulty.max] as [number, number]]));
      for (const item of createLevel({ levelId: level.id, seed: 101 })) {
        const budget = budgets[item.label];
        expect(budget).toBeDefined();
        const score = waveDifficultyScore(item);
        expect(score).toBeGreaterThanOrEqual(budget[0]);
        expect(score).toBeLessThanOrEqual(budget[1]);
      }
    }
  });
  it("generates distinct selectable levels", () => {
    const first = createLevel({ levelId: "brumes", seed: 42 });
    const second = createLevel({ levelId: "station", seed: 42 });
    const third = createLevel({ levelId: "toits", seed: 42 });
    const final = createLevel({ levelId: "armaggedon", seed: 42 });
    expect(first.map((item) => item.label)).not.toEqual(second.map((item) => item.label));
    expect(third.map((item) => item.label)).not.toEqual(second.map((item) => item.label));
    expect(second[second.length - 1]?.label).toBe("DERNIER MÉTRO");
    expect(third[third.length - 1]?.label).toBe("COURONNE D'ORAGE");
    expect(final.map((item) => item.label)).toEqual(["LES DEUX COLOSSES", "ARMAGGEDON"]);
  });
  it("regenerates wave content on each restart when using a factory", () => {
    let count = 0; const game = new TypingGame(() => wave(count++ === 0 ? "a" : "bus"));
    game.start(); game.update(600); expect(game.state.enemies[0].words[0]).toBe("a");
    game.start(); game.update(600); expect(game.state.enemies[0].words[0]).toBe("bus");
  });
  it("can start a new level with carried arcade run state", () => {
    const game = new TypingGame();
    game.selectLevel("station");
    game.start({ score: 1234, lives: 3, elapsedMs: 45000, totalKeys: 40, correctKeys: 36 });
    expect(game.state.phase).toBe("playing");
    expect(game.state.levelId).toBe("station");
    expect(game.state.score).toBe(1234);
    expect(game.state.lives).toBe(3);
    expect(game.state.combo).toBe(0);
    expect(game.state.maxCombo).toBe(0);
    expect(game.accuracy()).toBe(90);
    expect(game.wordsPerMinute()).toBe(10);
  });
  it("tracks max combo independently from the current combo", () => {
    const game = new TypingGame(wave("rue"));
    game.start(); game.update(600);
    expect(game.type("r")).toBe("hit");
    expect(game.type("u")).toBe("hit");
    expect(game.state.maxCombo).toBe(2);
    expect(game.type("x")).toBe("error");
    expect(game.state.combo).toBe(0);
    expect(game.state.maxCombo).toBe(2);
  });
  it("can award score bonuses and persist them in the record", () => {
    const game = new TypingGame(wave("a"));
    game.start(); game.update(600);
    game.type("a"); game.update(16); game.update(600);
    const scoreBeforeBonus = game.state.score;
    game.awardBonus(900);
    expect(game.state.score).toBe(scoreBeforeBonus + 900);
    expect(game.bestScore()).toBe(scoreBeforeBonus + 900);
  });
  it("supports debug wave jumps and enemy cleanup", () => {
    const debugWaves: WaveDefinition[] = [
      { label: "INTRO", travelMs: 0, enemies: [{ archetype: "walker", words: ["rue"], distance: 12, lane: 0 }] },
      { label: "BOSS", travelMs: 0, enemies: [{ archetype: "boss", words: ["terminus"], distance: 20, lane: 0 }] },
    ];
    const game = new TypingGame(debugWaves);
    expect(game.debugWaveCount()).toBe(2);
    game.debugJumpToWave(1);
    expect(game.state.phase).toBe("playing");
    expect(game.state.waveLabel).toBe("BOSS");
    expect(game.state.enemies[0].archetype).toBe("boss");
    game.debugClearEnemies();
    expect(game.state.enemies).toEqual([]);
  });
  it("uses visible seeds to regenerate deterministic debug runs", () => {
    const game = new TypingGame((seed) => wave(seed === 12 ? "rue" : "bus"));
    game.debugSetSeed(12);
    game.start(); game.update(600);
    expect(game.debugSeed()).toBe(12);
    expect(game.state.enemies[0].words[0]).toBe("rue");
    game.debugSetSeed(13); game.update(600);
    expect(game.state.enemies[0].words[0]).toBe("bus");
  });
  it("selects a level for debug and starts", () => {
    const game = new TypingGame();
    game.selectLevel("station");
    expect(game.selectedLevel().title).toBe("Station Souterraine");
    expect(game.selectedLevel().music).toBe("station");
    expect(game.state.levelTheme.id).toBe("station");
    game.start(); game.update(600);
    expect(game.state.levelTheme.id).toBe("station");
    expect(game.state.waveLabel).toBe("QUAIS FANTÔMES");
    const info = game.debugWaveInfo();
    expect(info[info.length - 1]?.label).toBe("DERNIER MÉTRO");
  });
  it("selects the third level blueprint with its own theme and music key", () => {
    const game = new TypingGame();
    game.selectLevel("toits");
    expect(game.selectedLevel().title).toBe("Toits Orageux");
    expect(game.selectedLevel().music).toBe("toits");
    expect(game.state.levelTheme.id).toBe("toits");
    game.start(); game.update(600);
    expect(game.state.waveLabel).toBe("ESCALIERS DE SECOURS");
  });
  it("selects the final boss level with its arena environment and music", () => {
    const game = new TypingGame();
    game.selectLevel("armaggedon");
    expect(game.selectedLevel().title).toBe("Armaggedon");
    expect(game.selectedLevel().music).toBe("armaggedon");
    expect(game.selectedLevel().environment).toBe("arena");
    game.start(); game.update(600);
    expect(game.state.levelEnvironment).toBe("arena");
    expect(game.state.waveLabel).toBe("LES DEUX COLOSSES");
    expect(game.state.enemies).toHaveLength(2);
    expect(game.state.enemies.every((enemy) => enemy.archetype === "brute" && enemy.words.length === 3)).toBe(true);
    game.debugSkipWave();
    expect(game.state.waveLabel).toBe("ARMAGGEDON");
    expect(game.state.enemies).toHaveLength(2);
    expect(game.state.enemies.every((enemy) => enemy.archetype === "boss" && enemy.words.length === 4)).toBe(true);
  });
  it("records per-wave tuning metrics", () => {
    const game = new TypingGame(wave("rue"));
    game.start(); game.update(600);
    expect(game.type("r")).toBe("hit");
    expect(game.type("x")).toBe("error");
    expect(game.type("u")).toBe("hit");
    expect(game.type("e")).toBe("kill");
    game.debugClearEnemies();
    const metrics = game.debugMetrics()[0];
    expect(metrics.label).toBe("TEST");
    expect(metrics.totalKeys).toBe(4);
    expect(metrics.correctKeys).toBe(3);
    expect(metrics.errors).toBe(1);
    expect(metrics.defeated).toBe(1);
  });
  it("exposes generated wave difficulty for debug tuning", () => {
    const game = new TypingGame(() => createLevel({ seed: 101 }));
    const info = game.debugWaveInfo();
    expect(info.map((item) => item.label)).toEqual(levels[0].waves.map((item) => item.label));
    expect(info.every((item) => item.difficulty > 0)).toBe(true);
  });
});
