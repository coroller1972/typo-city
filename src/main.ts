import "./style.css";
import { TypingGame, type StartOptions } from "./simulation/game";
import { ArcadeAudio } from "./render/audio";
import { World } from "./render/world";
import { musicManifest } from "./data/music";
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main id="game"><div id="labels"></div></main><section id="hud" class="hidden"><div class="lives"><small>SURVIE</small><strong id="lives"></strong><em id="music">MUSIQUE ON · F2/F3</em></div><div class="wave" id="wave"></div><div class="score"><small>SCORE</small><strong id="score">000000</strong><em id="combo"></em></div></section>
  <section id="overlay"><div class="panel" id="panel"></div></section><aside id="debug" class="debug hidden"></aside><div id="mobile">TYPO CITY nécessite un clavier physique.<br><small>Revenez depuis un ordinateur pour affronter la nuit.</small></div>`;
const game = new TypingGame(); const audio = new ArcadeAudio(); const labels = document.querySelector<HTMLElement>("#labels")!; const world = new World(labels);
document.querySelector("#game")!.prepend(world.renderer.domElement);
const overlay = document.querySelector<HTMLElement>("#overlay")!, panel = document.querySelector<HTMLElement>("#panel")!, hud = document.querySelector<HTMLElement>("#hud")!;
const lives = document.querySelector<HTMLElement>("#lives")!, score = document.querySelector<HTMLElement>("#score")!, combo = document.querySelector<HTMLElement>("#combo")!, wave = document.querySelector<HTMLElement>("#wave")!, music = document.querySelector<HTMLElement>("#music")!, debug = document.querySelector<HTMLElement>("#debug")!;
const timeScales = [1, .35, 2, 4] as const;
let lastPhase = game.state.phase, lastLives = game.state.lives, lastTime = performance.now(), fps = 60, debugVisible = false, timeScaleIndex = 0;
let runStartLevelId = game.selectedLevel().id;
let overlayAction: (() => void) | undefined;
const awardedBonusLevelIds = new Set<string>();
function entryScreen(): void {
  overlayAction = enterMainMenu;
  hud.classList.add("hidden");
  panel.classList.add("entry-panel");
  panel.innerHTML = `<button id="enter-menu" class="primary-action">COMMENCER</button>`;
  overlay.classList.remove("hidden");
  document.querySelector("#enter-menu")!.addEventListener("click", enterMainMenu);
}
function enterMainMenu(): void {
  overlayAction = undefined;
  audio.unlock();
  audio.setMusic("intro", { restart: true });
  audio.startMusic();
  menu();
}
function menu(): void {
  overlayAction = undefined;
  panel.classList.remove("entry-panel");
  audio.setMusic("intro");
  audio.startMusic();
  const levels = game.availableLevels();
  const levelButtons = levels.map((level, index) => `<button class="level-button" data-level="${level.id}"><span>Niveau ${index + 1}</span>${escapeHtml(level.title)}<small>${escapeHtml(level.subtitle)}</small></button>`).join("");
  const difficultyButtons = game.availableDifficulties().map((item) => `<button class="difficulty-button ${item.id === game.selectedDifficulty() ? "active" : ""}" data-difficulty="${item.id}"><span>${escapeHtml(item.label)}</span><small>vitesse ×${item.speedMultiplier.toFixed(2)}</small></button>`).join("");
  panel.innerHTML = `<p class="eyebrow">UNE NUIT. UN CLAVIER.</p><h1>TYPO <span>CITY</span></h1><p class="lead">Mode arcade: ${levels.length} niveaux enchaînés.<br>La ville a perdu sa voix. Il ne reste que vos mots.</p><div class="difficulty-select" id="difficulty-select">${difficultyButtons}</div><div class="menu-actions"><button id="arcade-start" class="primary-action">COMMENCER LA RUN</button><button id="level-toggle" class="secondary-action" aria-expanded="false">SÉLECTION DE NIVEAU</button></div><div class="level-select hidden" id="level-select">${levelButtons}</div><p class="record">RECORD LOCAL <b>${String(game.bestScore()).padStart(6, "0")}</b></p><p class="keys">Tapez les mots pour repousser les créatures · Échap pause · F2 mute · F3 volume · F10 debug</p>`;
  overlay.classList.remove("hidden");
  panel.addEventListener("pointerdown", unlockMenuMusic, { once: true });
  document.querySelector("#arcade-start")!.addEventListener("click", () => start(levels[0]?.id));
  document.querySelector("#level-toggle")!.addEventListener("click", () => {
    const select = document.querySelector<HTMLElement>("#level-select")!, toggle = document.querySelector<HTMLButtonElement>("#level-toggle")!;
    const hidden = select.classList.toggle("hidden");
    toggle.setAttribute("aria-expanded", String(!hidden));
  });
  document.querySelectorAll<HTMLButtonElement>(".difficulty-button").forEach((button) => button.addEventListener("click", () => {
    const difficulty = button.dataset.difficulty;
    if (difficulty === "easy" || difficulty === "normal" || difficulty === "hard" || difficulty === "nightmare") game.setDifficulty(difficulty);
    document.querySelectorAll(".difficulty-button").forEach((item) => item.classList.toggle("active", item === button));
  }));
  document.querySelectorAll<HTMLButtonElement>(".level-button").forEach((button) => button.addEventListener("click", () => start(button.dataset.level)));
}
function unlockMenuMusic(): void {
  if (game.state.phase !== "menu" || overlay.classList.contains("hidden")) return;
  audio.unlock();
  audio.setMusic("intro");
  audio.startMusic();
}
function start(levelId: string | undefined = game.selectedLevel().id, options: StartOptions = {}, continueRun = false): void {
  overlayAction = undefined;
  const selectedLevelId = levelId ?? game.selectedLevel().id;
  if (!continueRun) { runStartLevelId = selectedLevelId; awardedBonusLevelIds.clear(); }
  game.selectLevel(selectedLevelId); audio.unlock(); audio.setMusic(game.selectedLevel().music, { restart: true }); audio.play("start"); audio.startMusic(); game.start(options); overlay.classList.add("hidden"); hud.classList.remove("hidden"); lastPhase = game.state.phase; lastLives = game.state.lives;
}
function result(): void {
  overlayAction = undefined;
  const won = game.state.phase === "victory"; const next = won ? nextLevel() : undefined;
  const bonus = won ? awardCurrentLevelBonuses() : emptyBonusResult();
  if (next) { intermission(next); return; }
  panel.innerHTML = `<p class="eyebrow">${won ? "L'AUBE SE LÈVE" : "LA VILLE VOUS A DÉVORÉ"}</p><h2>${won ? "RUN TERMINÉE" : "PERDU DANS LA BRUME"}</h2><div class="stats"><div><small>SCORE</small><b>${game.state.score}</b></div><div><small>PRÉCISION</small><b>${game.accuracy()}%</b></div><div><small>VITESSE</small><b>${game.wordsPerMinute()} MPM</b></div><div><small>COMBO MAX</small><b>×${game.state.maxCombo}</b></div></div>${renderBonusList(bonus)}<p class="record">RECORD LOCAL <b>${String(game.bestScore()).padStart(6, "0")}</b></p><div class="result-actions"><button id="start" class="primary-action">REJOUER LA RUN</button><button id="menu-return" class="secondary-action">MENU PRINCIPAL</button></div>`; overlay.classList.remove("hidden"); document.querySelector("#start")!.addEventListener("click", () => start(runStartLevelId)); document.querySelector("#menu-return")!.addEventListener("click", returnToMenu);
}
function returnToMenu(): void {
  overlayAction = undefined;
  const firstLevelId = game.availableLevels()[0]?.id ?? game.selectedLevel().id;
  runStartLevelId = firstLevelId;
  awardedBonusLevelIds.clear();
  game.selectLevel(firstLevelId);
  audio.setMusic("intro", { restart: true });
  audio.startMusic();
  hud.classList.add("hidden");
  menu();
}
function intermission(next: ReturnType<TypingGame["selectedLevel"]>): void {
  const bonusLife = game.accuracy() >= 95 && game.state.lives < 5 ? 1 : 0;
  const bonus = awardCurrentLevelBonuses();
  const carry: StartOptions = { score: game.state.score, lives: Math.min(5, game.state.lives + bonusLife), maxCombo: game.state.maxCombo, elapsedMs: game.state.elapsedMs, totalKeys: game.state.totalKeys, correctKeys: game.state.correctKeys };
  panel.innerHTML = `<p class="eyebrow">NIVEAU TERMINÉ</p><h2>${escapeHtml(game.selectedLevel().title)}</h2><div class="stats"><div><small>SCORE RUN</small><b>${game.state.score}</b></div><div><small>PRÉCISION</small><b>${game.accuracy()}%</b></div><div><small>COMBO MAX</small><b>×${game.state.maxCombo}</b></div><div><small>BONUS VIE</small><b>${bonusLife ? "+1" : "0"}</b></div></div>${renderBonusList(bonus)}${renderNextBriefing(next)}<button id="continue">CONTINUER</button><p class="keys">Entrée pour continuer · Score conservé · combo réinitialisé · vies ${bonusLife ? "renforcées" : "conservées"}</p>`;
  overlay.classList.remove("hidden");
  let used = false;
  overlayAction = () => { if (used) return; used = true; start(next.id, carry, true); };
  document.querySelector("#continue")!.addEventListener("click", () => overlayAction?.());
}
function nextLevel(): ReturnType<TypingGame["selectedLevel"]> | undefined {
  const levels = game.availableLevels();
  const index = levels.findIndex((level) => level.id === game.selectedLevel().id);
  return index >= 0 ? levels[index + 1] : undefined;
}
function renderHud(): void { const s = game.state; lives.textContent = "■".repeat(s.lives) + "□".repeat(Math.max(0, 5 - s.lives)); score.textContent = String(s.score).padStart(6, "0"); combo.textContent = s.combo > 1 ? `COMBO ×${s.combo}` : ""; wave.textContent = s.waveLabel; music.textContent = `MUSIQUE ${audio.isMusicEnabled() ? `${audio.musicVolumePercent()}%` : "OFF"} · ${audio.currentMusicTitle()} · ${game.difficultyInfo().label} · F2/F3`; document.body.classList.toggle("error", s.errorFlash > 0); }
interface ScoreBonus { label: string; points: number }
interface BonusResult { items: ScoreBonus[]; total: number }
function awardCurrentLevelBonuses(): BonusResult {
  const bonus = calculateLevelBonuses();
  if (!awardedBonusLevelIds.has(game.state.levelId)) {
    game.awardBonus(bonus.total);
    awardedBonusLevelIds.add(game.state.levelId);
  }
  return bonus;
}
function calculateLevelBonuses(): BonusResult {
  const accuracy = game.accuracy();
  const damage = game.debugMetrics().reduce((sum, item) => sum + item.damage, 0);
  const items: ScoreBonus[] = [
    { label: "Précision", points: accuracy >= 98 ? 800 : accuracy >= 95 ? 500 : accuracy >= 90 ? 250 : 0 },
    { label: "Vies restantes", points: game.state.lives * 150 },
    { label: "No damage", points: damage === 0 ? 400 : 0 },
    { label: "Combo max", points: game.state.maxCombo >= 20 ? 500 : game.state.maxCombo >= 10 ? 250 : 0 },
  ].filter((item) => item.points > 0);
  return { items, total: items.reduce((sum, item) => sum + item.points, 0) };
}
function emptyBonusResult(): BonusResult { return { items: [], total: 0 }; }
function renderBonusList(bonus: BonusResult): string {
  if (!bonus.total) return "";
  const rows = bonus.items.map((item) => `<li><span>${escapeHtml(item.label)}</span><b>+${item.points}</b></li>`).join("");
  return `<div class="bonus-list"><div><small>BONUS NIVEAU</small><strong>+${bonus.total}</strong></div><ul>${rows}</ul></div>`;
}
function renderNextBriefing(next: ReturnType<TypingGame["selectedLevel"]>): string {
  return `<section class="next-briefing"><p class="eyebrow">PROCHAIN ARRÊT</p><h3>${escapeHtml(next.title)}</h3><p>${escapeHtml(next.briefing)}</p><div class="briefing-grid"><span><small>MENACE</small><b>${escapeHtml(next.threat)}</b></span><span><small>DÉCOR</small><b>${escapeHtml(environmentLabel(next.environment))}</b></span><span><small>MUSIQUE</small><b>${escapeHtml(musicManifest[next.music].title)}</b></span></div></section>`;
}
function environmentLabel(environment: string): string {
  return ({ street: "Rue", station: "Station", rooftop: "Toits", arena: "Arène finale" } as Record<string, string>)[environment] ?? environment;
}
function renderDebug(): void {
  debug.classList.toggle("hidden", !debugVisible); if (!debugVisible) return;
  const s = game.state, scale = timeScales[timeScaleIndex];
  const waveInfo = new Map(game.debugWaveInfo().map((item) => [item.index, item]));
  const rows = s.enemies.map((enemy) => { const word = enemy.words[enemy.activeWordIndex] ?? ""; return `<tr><td>${escapeHtml(enemy.id)}</td><td>${enemy.archetype}</td><td>${enemy.distance.toFixed(1)}</td><td>${enemy.lane.toFixed(2)}</td><td>${enemy.status}</td><td>${escapeHtml(word)}</td><td>${enemy.typedLength}/${word.length}</td></tr>`; }).join("") || `<tr><td colspan="7">Aucun ennemi actif</td></tr>`;
  const metrics = game.debugMetrics().map((item) => {
    const duration = ((item.endedAtMs ?? s.elapsedMs) - item.startedAtMs) / 1000;
    const acc = item.totalKeys ? Math.round(item.correctKeys / item.totalKeys * 100) : 100;
    return `<tr><td>${item.index + 1}</td><td>${escapeHtml(item.label)}</td><td>${waveInfo.get(item.index)?.difficulty ?? "-"}</td><td>${duration.toFixed(1)}s</td><td>${item.totalKeys}</td><td>${acc}%</td><td>${item.errors}</td><td>${item.damage}</td><td>${item.defeated}</td></tr>`;
  }).join("") || `<tr><td colspan="9">Aucune métrique de vague</td></tr>`;
  const currentDifficulty = waveInfo.get(s.waveIndex)?.difficulty ?? "-";
  const selectedLevel = game.selectedLevel();
  debug.innerHTML = `<h3>DEBUG PLAYTEST <span>F10</span></h3><div class="debug-grid"><b>Level</b><span>${escapeHtml(selectedLevel.title)}</span><b>Theme</b><span>${escapeHtml(selectedLevel.theme.id)}</span><b>Env</b><span>${escapeHtml(selectedLevel.environment)}</span><b>Mode</b><span>${escapeHtml(game.difficultyInfo().label)} ×${game.difficultyInfo().speedMultiplier.toFixed(2)}</span><b>Music</b><span>${escapeHtml(audio.currentMusicKey())}</span><b>Phase</b><span>${s.phase}</span><b>Wave</b><span>${s.waveIndex + 1}/${game.debugWaveCount()} ${escapeHtml(s.waveLabel || "-")}</span><b>Seed</b><span>${game.debugSeed()}</span><b>Diff</b><span>${currentDifficulty}</span><b>FPS</b><span>${Math.round(fps)}</span><b>Time</b><span>x${scale}</span><b>Score</b><span>${s.score}</span><b>Acc</b><span>${game.accuracy()}%</span><b>WPM</b><span>${game.wordsPerMinute()}</span></div><p>F5 nouvelle seed · F6 vague suivante · F7 boss · F8 vitesse · F9 nettoyer</p><table><thead><tr><th>ID</th><th>Type</th><th>Dist</th><th>Lane</th><th>Status</th><th>Mot</th><th>Prog</th></tr></thead><tbody>${rows}</tbody></table><h4>Métriques vagues</h4><table><thead><tr><th>#</th><th>Label</th><th>Diff</th><th>Temps</th><th>Keys</th><th>Acc</th><th>Err</th><th>Dmg</th><th>Kill</th></tr></thead><tbody>${metrics}</tbody></table>`;
}
function handleDebugKey(event: KeyboardEvent): boolean {
  if (event.key === "F10") { event.preventDefault(); debugVisible = !debugVisible; renderDebug(); return true; }
  if (!debugVisible) return false;
  if (event.key === "F5") { event.preventDefault(); game.debugRerollSeed(); revealGameplay(); renderDebug(); return true; }
  if (event.key === "F6") { event.preventDefault(); game.debugSkipWave(); revealGameplay(); renderDebug(); return true; }
  if (event.key === "F7") { event.preventDefault(); game.debugJumpToWave(game.debugWaveCount() - 1); revealGameplay(); renderDebug(); return true; }
  if (event.key === "F8") { event.preventDefault(); timeScaleIndex = (timeScaleIndex + 1) % timeScales.length; renderDebug(); return true; }
  if (event.key === "F9") { event.preventDefault(); game.debugClearEnemies(); revealGameplay(); renderDebug(); return true; }
  return false;
}
function revealGameplay(): void {
  overlay.classList.add("hidden"); hud.classList.remove("hidden");
  if (game.state.phase === "playing" || game.state.phase === "paused") { lastPhase = game.state.phase; lastLives = game.state.lives; }
}
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char]!)); }
window.addEventListener("keydown", (event) => { if (handleDebugKey(event)) return; if (event.key === "Enter" && overlayAction && !overlay.classList.contains("hidden")) { event.preventDefault(); overlayAction(); return; } if (event.key === "F2") { event.preventDefault(); audio.unlock(); audio.toggleMusic(); renderHud(); return; } if (event.key === "F3") { event.preventDefault(); audio.unlock(); audio.cycleMusicVolume(); renderHud(); return; } if (event.key === "Escape") { game.togglePause(); overlay.classList.toggle("hidden", game.state.phase !== "paused"); if (game.state.phase === "paused") panel.innerHTML = `<p class="eyebrow">PAUSE</p><h2>REPRENEZ VOTRE SOUFFLE</h2><p class="keys">Échap pour retourner dans la nuit · F2 mute · F3 volume</p>`; return; } const result = game.type(event.key); const feedback = game.consumeInputFeedback(); if (result !== "ignored") { audio.play(result === "error" ? "error" : result === "kill" ? "kill" : "hit"); if (feedback) world.registerInputFeedback(feedback); if (result !== "error") world.flash(result === "kill" ? "kill" : "hit"); } });
function frame(now: number): void { const rawDelta = Math.min(50, now - lastTime); lastTime = now; fps = fps * .92 + 1000 / Math.max(1, rawDelta) * .08; const delta = rawDelta * timeScales[timeScaleIndex]; game.update(delta); if (game.state.lives < lastLives) audio.play("damage"); lastLives = game.state.lives; if (game.state.phase !== lastPhase && (game.state.phase === "victory" || game.state.phase === "defeat")) { audio.play(game.state.phase === "victory" ? "win" : "damage"); result(); } lastPhase = game.state.phase; world.update(game.state, delta); renderHud(); renderDebug(); requestAnimationFrame(frame); }
entryScreen(); requestAnimationFrame(frame);
