import * as THREE from "three";
import type { EnvironmentMaterialSet } from "./environmentMaterials";

type Vec3 = readonly [number, number, number];
interface InstanceTransform { position: Vec3; scale?: Vec3; rotation?: Vec3 }

export interface StreetEnvironmentResult {
  lights: THREE.PointLight[];
  signMaterials: THREE.MeshStandardMaterial[];
  ownedMaterials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
}

export function buildStreetEnvironment(root: THREE.Group, materials: EnvironmentMaterialSet): StreetEnvironmentResult {
  const lights: THREE.PointLight[] = [];
  const signMaterials: THREE.MeshStandardMaterial[] = [];
  const ownedMaterials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const unitBox = trackGeometry(new THREE.BoxGeometry(1, 1, 1));
  const unitCylinder = trackGeometry(new THREE.CylinderGeometry(1, 1, 1, 8));
  const groundGeometry = trackGeometry(new THREE.PlaneGeometry(30, 145));
  const ground = new THREE.Mesh(groundGeometry, materials.asphalt);
  ground.name = "street_ground"; ground.rotation.x = -Math.PI / 2; ground.position.z = -52; ground.receiveShadow = true; root.add(ground);

  const darkWindow = detailMaterial(0x31445b, 0x081422, .12);
  const cyanWindow = detailMaterial(0x78b8c2, 0x2c8da8, .48);
  const warmWindow = detailMaterial(0xc5a36f, 0xb75b31, .42);
  const storefront = detailMaterial(0x6d94a1, 0x255f75, .28);
  const carPaint = materials.paintedMetal.clone(); carPaint.color.setHex(0x54405d); carPaint.roughness = .67; ownedMaterials.push(carPaint);
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x11131a, roughness: .96, metalness: .02 }); ownedMaterials.push(tireMaterial);

  addBoxes("street_sidewalks", materials.concrete, [
    { position: [-5.7, .11, -52], scale: [2.1, .22, 145] },
    { position: [5.7, .11, -52], scale: [2.1, .22, 145] },
  ]);
  addBoxes("street_curbs", materials.concrete, [
    { position: [-4.58, .19, -52], scale: [.18, .38, 145] },
    { position: [4.58, .19, -52], scale: [.18, .38, 145] },
  ]);

  const buildings: InstanceTransform[] = [];
  const cornices: InstanceTransform[] = [];
  const darkWindows: InstanceTransform[] = [];
  const cyanWindows: InstanceTransform[] = [];
  const warmWindows: InstanceTransform[] = [];
  const storefronts: InstanceTransform[] = [];
  const doors: InstanceTransform[] = [];
  const awnings: InstanceTransform[] = [];
  const pipes: InstanceTransform[] = [];

  for (let z = 8; z > -120; z -= 9) for (const side of [-1, 1]) {
    const seed = `street:${z}:${side}`;
    const height = 8 + street01(`${seed}:height`) * 10;
    const width = 7.2 + street01(`${seed}:width`) * 1.1;
    const depth = 6.8 + street01(`${seed}:depth`) * 1.25;
    const setback = street01(`${seed}:setback`) * .72;
    const innerFace = 6.72 + setback;
    const centerX = side * (innerFace + width / 2);
    buildings.push({ position: [centerX, .22 + height / 2, z], scale: [width, height, depth] });
    cornices.push({ position: [side * (innerFace - .05), height + .28, z], scale: [.3, .28, depth + .18] });

    const floors = Math.max(2, Math.floor((height - 2.4) / 2.25));
    const facadeX = side * (innerFace - .07);
    const isShop = street01(`${seed}:shop`) > .66;
    for (let floor = 0; floor < floors; floor++) for (const offsetZ of [-1.85, 1.85]) {
      const transform = { position: [facadeX, 3.55 + floor * 2.2, z + offsetZ], scale: [.18, 1.18, 1.32] } satisfies InstanceTransform;
      const light = street01(`${seed}:window:${floor}:${offsetZ}`);
      if (light > .79) warmWindows.push(transform); else if (light > .63) cyanWindows.push(transform); else darkWindows.push(transform);
    }

    if (isShop) {
      storefronts.push({ position: [facadeX, 1.58, z - .72], scale: [.2, 2.42, 3.25] });
      doors.push({ position: [facadeX - side * .025, 1.38, z + 2.08], scale: [.24, 2.32, 1.08] });
      awnings.push({ position: [side * (innerFace - .58), 2.9, z - .72], scale: [1.02, .16, 3.55], rotation: [0, 0, side * -.13] });
      addProjectingSign(side, innerFace, z + 2.6, z % 18 ? 0x35c8ff : 0xff2d72);
    } else {
      doors.push({ position: [facadeX, 1.38, z + (street01(`${seed}:door`) > .5 ? 1.9 : -1.9)], scale: [.2, 2.32, 1.18] });
    }
    const pipeZ = z + (street01(`${seed}:pipe`) > .5 ? depth * .42 : -depth * .42);
    pipes.push({ position: [side * (innerFace - .12), height / 2, pipeZ], scale: [.085, height - .35, .085] });
  }

  addBoxes("street_building_shells", materials.brick, buildings);
  addBoxes("street_cornices", materials.concrete, cornices);
  addBoxes("street_windows_dark", darkWindow, darkWindows);
  addBoxes("street_windows_cyan", cyanWindow, cyanWindows);
  addBoxes("street_windows_warm", warmWindow, warmWindows);
  addBoxes("street_storefronts", storefront, storefronts);
  addBoxes("street_doors", materials.paintedMetal, doors);
  addBoxes("street_awnings", materials.paintedMetal, awnings);
  addCylinders("street_drainpipes", materials.paintedMetal, pipes);

  const lampPoles: InstanceTransform[] = [];
  const lampHeads: InstanceTransform[] = [];
  for (let z = 0; z > -112; z -= 18) {
    const side = z % 36 ? -1 : 1; const x = side * 4.95; const color = z % 36 ? 0x6fdfff : 0xff5a8d;
    lampPoles.push({ position: [x, 2.25, z], scale: [.09, 4.5, .09] });
    lampHeads.push({ position: [x - side * .28, 4.45, z], scale: [.72, .22, .38] });
    const light = new THREE.PointLight(color, 8, 21, 1.7); light.position.set(x - side * .25, 4.25, z); lights.push(light); root.add(light);
  }
  addCylinders("street_lamp_poles", materials.paintedMetal, lampPoles);
  addBoxes("street_lamp_heads", cyanWindow, lampHeads);

  const bins: InstanceTransform[] = [];
  const bollards: InstanceTransform[] = [];
  for (let z = -8; z > -108; z -= 20) {
    const side = z % 40 ? -1 : 1;
    bins.push({ position: [side * 5.65, .72, z], scale: [.82, 1.12, .82], rotation: [0, (z % 3) * .18, 0] });
    for (const offset of [-2.1, 2.1]) bollards.push({ position: [-side * 4.88, .5, z + offset], scale: [.11, .82, .11] });
  }
  addBoxes("street_bins", materials.paintedMetal, bins);
  addCylinders("street_bollards", materials.paintedMetal, bollards);
  addAbandonedCar(-3.55, -45);
  addBarricade(5.45, -68);

  return { lights, signMaterials, ownedMaterials, geometries };

  function trackGeometry<T extends THREE.BufferGeometry>(geometry: T): T { geometries.push(geometry); return geometry; }
  function detailMaterial(color: number, emissive: number, intensity: number): THREE.MeshStandardMaterial {
    const material = materials.glass.clone(); material.color.setHex(color); material.emissive.setHex(emissive); material.emissiveIntensity = intensity; ownedMaterials.push(material); return material;
  }
  function addInstances(name: string, geometry: THREE.BufferGeometry, material: THREE.Material, transforms: InstanceTransform[]): void {
    if (!transforms.length) return;
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length); const dummy = new THREE.Object3D(); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true;
    transforms.forEach((transform, index) => {
      dummy.position.set(...transform.position); dummy.rotation.set(...(transform.rotation ?? [0, 0, 0])); dummy.scale.set(...(transform.scale ?? [1, 1, 1])); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage); mesh.computeBoundingSphere(); root.add(mesh);
  }
  function addBoxes(name: string, material: THREE.Material, transforms: InstanceTransform[]): void { addInstances(name, unitBox, material, transforms); }
  function addCylinders(name: string, material: THREE.Material, transforms: InstanceTransform[]): void { addInstances(name, unitCylinder, material, transforms); }
  function addProjectingSign(side: number, innerFace: number, z: number, color: number): void {
    const material = materials.glass.clone(); material.color.setHex(color); material.emissive.setHex(color); material.emissiveIntensity = 1.25; signMaterials.push(material);
    addBoxes(`street_sign_${signMaterials.length}`, material, [{ position: [side * (innerFace - .78), 3.42, z], scale: [1.35, .78, .14] }]);
    addBoxes(`street_sign_bracket_${signMaterials.length}`, materials.paintedMetal, [{ position: [side * (innerFace - .38), 3.84, z], scale: [.78, .08, .08] }]);
  }
  function addAbandonedCar(x: number, z: number): void {
    addBoxes("street_abandoned_car", carPaint, [
      { position: [x, .62, z], scale: [1.85, .62, 3.65], rotation: [0, .08, 0] },
      { position: [x, 1.18, z - .28], scale: [1.55, .65, 1.82], rotation: [0, .08, 0] },
    ]);
    addCylinders("street_abandoned_car_wheels", tireMaterial, [-.98, .98].flatMap((sideX) => [-1.08, 1.08].map((offsetZ) => ({ position: [x + sideX, .43, z + offsetZ], scale: [.34, .2, .34], rotation: [0, 0, Math.PI / 2] } as InstanceTransform))));
    addBoxes("street_abandoned_car_windows", darkWindow, [{ position: [x, 1.35, z - .3], scale: [1.58, .34, 1.32], rotation: [0, .08, 0] }]);
  }
  function addBarricade(x: number, z: number): void {
    addBoxes("street_barricade", materials.paintedMetal, [
      { position: [x, .83, z], scale: [.14, .14, 2.5], rotation: [.18, 0, 0] },
      { position: [x, .42, z - .92], scale: [.12, .84, .12] },
      { position: [x, .42, z + .92], scale: [.12, .84, .12] },
    ]);
  }
}

function street01(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) { hash ^= key.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}
