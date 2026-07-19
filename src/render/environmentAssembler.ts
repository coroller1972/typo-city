import * as THREE from "three";
import type { EnvironmentMaterialKey, EnvironmentMaterialSet } from "./environmentMaterials";

export type Vec3 = readonly [number, number, number];
export interface InstanceTransform { position: Vec3; scale?: Vec3; rotation?: Vec3 }
export interface EnvironmentBuildResult {
  lights: THREE.PointLight[];
  signMaterials: THREE.MeshStandardMaterial[];
  ownedMaterials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
}

export class EnvironmentAssembler {
  private readonly lights: THREE.PointLight[] = [];
  private readonly signMaterials: THREE.MeshStandardMaterial[] = [];
  private readonly ownedMaterials: THREE.Material[] = [];
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly unitBox = this.track(new THREE.BoxGeometry(1, 1, 1));
  private readonly unitCylinder = this.track(new THREE.CylinderGeometry(1, 1, 1, 8));

  constructor(private readonly root: THREE.Group, readonly materials: EnvironmentMaterialSet) {}

  boxes(name: string, material: THREE.Material, transforms: InstanceTransform[]): void { this.instances(name, this.unitBox, material, transforms); }
  cylinders(name: string, material: THREE.Material, transforms: InstanceTransform[]): void { this.instances(name, this.unitCylinder, material, transforms); }
  instances(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, transforms: InstanceTransform[]): void {
    if (!transforms.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length); const dummy = new THREE.Object3D(); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true;
    transforms.forEach((transform, index) => {
      dummy.position.set(...transform.position); dummy.rotation.set(...(transform.rotation ?? [0, 0, 0])); dummy.scale.set(...(transform.scale ?? [1, 1, 1])); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); mesh.computeBoundingSphere(); this.root.add(mesh);
  }
  material(base: EnvironmentMaterialKey, color: number, emissive = 0x000000, emissiveIntensity = 0): THREE.MeshStandardMaterial {
    const material = this.materials[base].clone(); material.color.setHex(color); material.emissive.setHex(emissive); material.emissiveIntensity = emissiveIntensity; this.ownedMaterials.push(material); return material;
  }
  plainMaterial(options: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial(options); this.ownedMaterials.push(material); return material;
  }
  signMaterial(color: number, intensity = 1.2): THREE.MeshStandardMaterial {
    const material = this.materials.glass.clone(); material.color.setHex(color); material.emissive.setHex(color); material.emissiveIntensity = intensity; this.signMaterials.push(material); return material;
  }
  pointLight(color: number, intensity: number, distance: number, position: Vec3): void {
    const light = new THREE.PointLight(color, intensity, distance, 1.7); light.position.set(...position); this.lights.push(light); this.root.add(light);
  }
  line(name: string, points: Vec3[], color: number, opacity = .6): void {
    const geometry = this.track(new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point))));
    const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }); this.ownedMaterials.push(material);
    const line = new THREE.Line(geometry, material); line.name = name; this.root.add(line);
  }
  track<T extends THREE.BufferGeometry>(geometry: T): T { this.geometries.push(geometry); return geometry; }
  finish(): EnvironmentBuildResult { return { lights: this.lights, signMaterials: this.signMaterials, ownedMaterials: this.ownedMaterials, geometries: this.geometries }; }
}

export function environment01(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) { hash ^= key.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}
