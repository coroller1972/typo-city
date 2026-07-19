import * as THREE from "three";
import type { LevelTheme } from "../simulation/types";
import type { TextureKey } from "./assets";

interface SurfaceDefinition {
  map: TextureKey;
  roughnessMap?: TextureKey;
  normalMap?: TextureKey;
  repeat: readonly [number, number];
  roughness: number;
  metalness: number;
  normalScale?: number;
  transparent?: boolean;
  opacity?: number;
}

const surfaceDefinitions = {
  asphalt: { map: "asphalt", roughnessMap: "asphalt_roughness", normalMap: "asphalt_normal", repeat: [8, 40], roughness: .9, metalness: .02, normalScale: .52 },
  brick: { map: "brick", roughnessMap: "brick_roughness", normalMap: "brick_normal", repeat: [6, 8], roughness: .84, metalness: 0, normalScale: .68 },
  concrete: { map: "concrete", roughnessMap: "concrete_roughness", normalMap: "concrete_normal", repeat: [4, 8], roughness: .88, metalness: 0, normalScale: .42 },
  paintedMetal: { map: "painted_metal", roughnessMap: "painted_metal_roughness", normalMap: "painted_metal_normal", repeat: [4, 12], roughness: .58, metalness: .22, normalScale: .35 },
  glass: { map: "glass", roughnessMap: "glass_roughness", repeat: [1, 1], roughness: .24, metalness: .08, transparent: true, opacity: .82 },
  tile: { map: "tile", roughnessMap: "tile_roughness", normalMap: "tile_normal", repeat: [10, 36], roughness: .72, metalness: .02, normalScale: .38 },
  roof: { map: "roof", roughnessMap: "roof_roughness", normalMap: "roof_normal", repeat: [8, 36], roughness: .92, metalness: 0, normalScale: .48 },
} as const satisfies Record<string, SurfaceDefinition>;

export type EnvironmentMaterialKey = keyof typeof surfaceDefinitions;
export type EnvironmentMaterialSet = Record<EnvironmentMaterialKey, THREE.MeshStandardMaterial>;

export function createEnvironmentMaterials(): EnvironmentMaterialSet {
  const definitions = Object.entries(surfaceDefinitions) as Array<[EnvironmentMaterialKey, SurfaceDefinition]>;
  return Object.fromEntries(definitions.map(([key, definition]) => [key, new THREE.MeshStandardMaterial({
    name: `environment_${key}`,
    color: 0xffffff,
    roughness: definition.roughness,
    metalness: definition.metalness,
    transparent: definition.transparent ?? false,
    opacity: definition.opacity ?? 1,
  })])) as EnvironmentMaterialSet;
}

export function applyEnvironmentTextures(materials: EnvironmentMaterialSet, textures: ReadonlyMap<TextureKey, THREE.Texture>): void {
  for (const [key, definition] of Object.entries(surfaceDefinitions) as Array<[EnvironmentMaterialKey, SurfaceDefinition]>) {
    const material = materials[key];
    replaceTexture(material, "map", textures.get(definition.map), definition.repeat);
    replaceTexture(material, "roughnessMap", definition.roughnessMap ? textures.get(definition.roughnessMap) : undefined, definition.repeat);
    replaceTexture(material, "normalMap", definition.normalMap ? textures.get(definition.normalMap) : undefined, definition.repeat);
    const normalScale = definition.normalScale ?? 0;
    material.normalScale.set(normalScale, normalScale);
    material.needsUpdate = true;
  }
}

export function applyEnvironmentTheme(materials: EnvironmentMaterialSet, theme: LevelTheme): void {
  materials.asphalt.color.copy(themeTint(theme.ground, .48));
  materials.tile.color.copy(themeTint(theme.ground, .42));
  materials.roof.color.copy(themeTint(theme.ground, .48));
  materials.brick.color.copy(themeTint(theme.buildings, .46));
  materials.concrete.color.copy(themeTint(theme.buildings, .48));
  materials.paintedMetal.color.copy(themeTint(theme.buildings, .58));
  materials.glass.color.copy(themeTint(theme.neonSecondary, .28));
  materials.glass.emissive.setHex(theme.neonSecondary);
  materials.glass.emissiveIntensity = .16;
}

function replaceTexture(
  material: THREE.MeshStandardMaterial,
  slot: "map" | "roughnessMap" | "normalMap",
  source: THREE.Texture | undefined,
  repeat: readonly [number, number],
): void {
  material[slot]?.dispose();
  if (!source) { material[slot] = null; return; }
  const texture = source.clone();
  texture.repeat.set(...repeat);
  texture.needsUpdate = true;
  material[slot] = texture;
}

function themeTint(color: number, whiteMix: number): THREE.Color {
  return new THREE.Color(color).lerp(new THREE.Color(0xffffff), whiteMix);
}
