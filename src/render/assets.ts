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
  asphalt: { url: "/assets/textures/asphalt.png", colorSpace: "srgb" },
  asphalt_roughness: { url: "/assets/textures/asphalt-roughness.png", colorSpace: "linear" },
  asphalt_normal: { url: "/assets/textures/asphalt-normal.png", colorSpace: "linear" },
  brick: { url: "/assets/textures/brick.png", colorSpace: "srgb" },
  brick_roughness: { url: "/assets/textures/brick-roughness.png", colorSpace: "linear" },
  brick_normal: { url: "/assets/textures/brick-normal.png", colorSpace: "linear" },
  concrete: { url: "/assets/textures/concrete.png", colorSpace: "srgb" },
  concrete_roughness: { url: "/assets/textures/concrete-roughness.png", colorSpace: "linear" },
  concrete_normal: { url: "/assets/textures/concrete-normal.png", colorSpace: "linear" },
  painted_metal: { url: "/assets/textures/painted-metal.png", colorSpace: "srgb" },
  painted_metal_roughness: { url: "/assets/textures/painted-metal-roughness.png", colorSpace: "linear" },
  painted_metal_normal: { url: "/assets/textures/painted-metal-normal.png", colorSpace: "linear" },
  glass: { url: "/assets/textures/glass.png", colorSpace: "srgb" },
  glass_roughness: { url: "/assets/textures/glass-roughness.png", colorSpace: "linear" },
  tile: { url: "/assets/textures/tile.png", colorSpace: "srgb" },
  tile_roughness: { url: "/assets/textures/tile-roughness.png", colorSpace: "linear" },
  tile_normal: { url: "/assets/textures/tile-normal.png", colorSpace: "linear" },
  roof: { url: "/assets/textures/roof.png", colorSpace: "srgb" },
  roof_roughness: { url: "/assets/textures/roof-roughness.png", colorSpace: "linear" },
  roof_normal: { url: "/assets/textures/roof-normal.png", colorSpace: "linear" },
  facade: { url: "/assets/textures/facade.png", colorSpace: "srgb" },
  cloth: { url: "/assets/textures/cloth.png", colorSpace: "srgb" },
  skin: { url: "/assets/textures/skin.png", colorSpace: "srgb" },
  runner_skin: { url: "/assets/textures/runner-skin.png", colorSpace: "srgb" },
  brute_skin: { url: "/assets/textures/brute-skin.png", colorSpace: "srgb" },
  boss_skin: { url: "/assets/textures/boss-skin.png", colorSpace: "srgb" },
  steel: { url: "/assets/textures/metal.png", colorSpace: "srgb" },
  stone: { url: "/assets/textures/stone.png", colorSpace: "srgb" },
} as const;

export type TextureKey = keyof typeof textureManifest;

export const audioManifest = {
  music: musicManifest.intro.url,
  musicByLevel: musicManifest,
} as const;
