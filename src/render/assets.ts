import { musicManifest } from "../data/music";

export const assetManifest = {
  "vendor.zombie-pack": { kind: "glb", url: "/assets/vendor/super-low-poly-stylized-zombies-animated.glb" },
  "enemy.walker": { kind: "glb", url: "/assets/characters/walker.glb" },
  "enemy.runner": { kind: "glb", url: "/assets/characters/runner.glb" },
  "enemy.brute": { kind: "glb", url: "/assets/characters/brute.glb" },
  "enemy.boss": { kind: "glb", url: "/assets/characters/boss.glb" },
  "environment.city-kit": { kind: "glb", url: "/assets/environment/city-kit.glb" },
} as const;

export type AssetKey = keyof typeof assetManifest;

export const textureManifest = {
  asphalt: "/assets/textures/asphalt.png",
  facade: "/assets/textures/facade.png",
  cloth: "/assets/textures/cloth.png",
  skin: "/assets/textures/skin.png",
  runner_skin: "/assets/textures/runner-skin.png",
  brute_skin: "/assets/textures/brute-skin.png",
  boss_skin: "/assets/textures/boss-skin.png",
  steel: "/assets/textures/metal.png",
  stone: "/assets/textures/stone.png",
} as const;

export type TextureKey = keyof typeof textureManifest;

export const audioManifest = {
  music: musicManifest.intro.url,
  musicByLevel: musicManifest,
} as const;
