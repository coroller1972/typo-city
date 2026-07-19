import * as THREE from "three";
import { EnvironmentAssembler, environment01, type EnvironmentBuildResult, type InstanceTransform } from "./environmentAssembler";
import type { EnvironmentMaterialSet } from "./environmentMaterials";

export function buildStationEnvironment(root: THREE.Group, materials: EnvironmentMaterialSet): EnvironmentBuildResult {
  const scene = new EnvironmentAssembler(root, materials);
  const trackMaterial = scene.material("roof", 0x293436);
  const tunnelMaterial = scene.plainMaterial({ color: 0x020708, roughness: 1 });
  const fixtureMaterial = scene.material("glass", 0xa4e8d8, 0x5be7cb, .85);

  scene.boxes("station_base", materials.concrete, [{ position: [0, -.08, -52], scale: [24, .16, 145] }]);
  scene.boxes("station_platforms", materials.tile, [
    { position: [-6.35, .16, -52], scale: [6.6, .32, 145] },
    { position: [6.35, .16, -52], scale: [6.6, .32, 145] },
  ]);
  scene.boxes("station_track_bed", trackMaterial, [{ position: [0, .02, -52], scale: [6.05, .12, 145] }]);
  scene.boxes("station_rails", materials.paintedMetal, [
    { position: [-1.28, .18, -52], scale: [.16, .16, 140] },
    { position: [1.28, .18, -52], scale: [.16, .16, 140] },
  ]);
  const sleepers: InstanceTransform[] = [];
  for (let z = 10; z > -124; z -= 2.4) sleepers.push({ position: [0, .1, z], scale: [4.75, .12, .24] });
  scene.boxes("station_sleepers", materials.paintedMetal, sleepers);

  scene.boxes("station_side_walls", materials.concrete, [
    { position: [-11, 3.2, -52], scale: [2.1, 6.4, 145] },
    { position: [11, 3.2, -52], scale: [2.1, 6.4, 145] },
  ]);
  scene.boxes("station_ceiling", materials.paintedMetal, [{ position: [0, 6.62, -52], scale: [23.2, .34, 145] }]);
  const columns: InstanceTransform[] = []; const beams: InstanceTransform[] = [];
  for (let z = 8; z > -122; z -= 12) {
    columns.push({ position: [-6.65, 2.82, z], scale: [.62, 5.3, .62] }, { position: [6.65, 2.82, z], scale: [.62, 5.3, .62] });
    beams.push({ position: [0, 5.85, z], scale: [22.4, .38, .62] });
  }
  scene.boxes("station_columns", materials.concrete, columns); scene.boxes("station_ceiling_beams", materials.paintedMetal, beams);

  const pipeRuns: InstanceTransform[] = [];
  for (const x of [-9.35, 9.35]) pipeRuns.push({ position: [x, 5.48, -52], scale: [.12, 140, .12], rotation: [Math.PI / 2, 0, 0] });
  scene.cylinders("station_service_pipes", materials.paintedMetal, pipeRuns);

  const benchSeats: InstanceTransform[] = []; const benchBacks: InstanceTransform[] = []; const benchLegs: InstanceTransform[] = [];
  const kiosks: InstanceTransform[] = [];
  for (let z = -12; z > -108; z -= 28) for (const side of [-1, 1]) {
    benchSeats.push({ position: [side * 7.15, .7, z], scale: [2.2, .18, .72] });
    benchBacks.push({ position: [side * 7.55, 1.25, z], scale: [.16, 1.18, 2.2] });
    benchLegs.push({ position: [side * 7.15, .38, z - .72], scale: [.14, .6, .14] }, { position: [side * 7.15, .38, z + .72], scale: [.14, .6, .14] });
    if (side > 0) kiosks.push({ position: [side * 8.25, 1.25, z - 8], scale: [1.25, 2.35, 1.05] });
  }
  scene.boxes("station_bench_seats", materials.paintedMetal, benchSeats); scene.boxes("station_bench_backs", materials.paintedMetal, benchBacks); scene.boxes("station_bench_legs", materials.paintedMetal, benchLegs); scene.boxes("station_kiosks", materials.paintedMetal, kiosks);

  for (let z = -6, index = 0; z > -112; z -= 24, index++) for (const side of [-1, 1]) {
    const sign = scene.signMaterial(index % 2 ? 0x25f0d0 : 0xf3cf5a, .8);
    scene.boxes(`station_wall_sign_${index}_${side}`, sign, [{ position: [side * 9.88, 2.85, z + side * 2], scale: [.16, 1.05, 3.2] }]);
  }

  const lightFixtures: InstanceTransform[] = [];
  for (let z = 0, index = 0; z > -116; z -= 16, index++) {
    const x = index % 2 ? -4.6 : 4.6; const color = index % 2 ? 0x25f0d0 : 0xf3cf5a;
    lightFixtures.push({ position: [x, 5.72, z], scale: [1.6, .18, .42] }); scene.pointLight(color, 8, 18, [x, 5.35, z]);
  }
  scene.boxes("station_light_fixtures", fixtureMaterial, lightFixtures);

  scene.boxes("station_tunnel_void", tunnelMaterial, [{ position: [0, 3.1, -122], scale: [8.4, 6.2, .8] }]);
  scene.boxes("station_tunnel_portal", materials.concrete, [
    { position: [-4.95, 3.2, -121], scale: [1.5, 6.4, 2.2] },
    { position: [4.95, 3.2, -121], scale: [1.5, 6.4, 2.2] },
    { position: [0, 6.15, -121], scale: [11.4, 1.1, 2.2] },
  ]);
  return scene.finish();
}

export function buildRooftopEnvironment(root: THREE.Group, materials: EnvironmentMaterialSet): EnvironmentBuildResult {
  const scene = new EnvironmentAssembler(root, materials);
  const darkMetal = scene.material("paintedMetal", 0x303142);
  const ventMaterial = scene.material("paintedMetal", 0x59606e);
  const tankMaterial = scene.material("paintedMetal", 0x635d78);
  const lampMaterial = scene.material("glass", 0xb58bd5, 0xa45cff, .75);
  scene.boxes("rooftop_deck", materials.roof, [{ position: [0, -.06, -52], scale: [20, .12, 145] }]);
  scene.boxes("rooftop_parapets", materials.concrete, [
    { position: [-7, .58, -52], scale: [.78, 1.16, 142] },
    { position: [7, .58, -52], scale: [.78, 1.16, 142] },
  ]);

  const skylineBrick: InstanceTransform[] = []; const skylineConcrete: InstanceTransform[] = [];
  for (const side of [-1, 1]) for (let z = 6; z > -122; z -= 18) {
    const seed = `roof:${side}:${z}`; const height = 7 + environment01(`${seed}:height`) * 6; const width = 7.5 + environment01(`${seed}:width`) * 2;
    const transform = { position: [side * (12.2 + width / 2), height / 2 - 1.4, z], scale: [width, height, 8.5] } satisfies InstanceTransform;
    (environment01(seed) > .5 ? skylineBrick : skylineConcrete).push(transform);
  }
  scene.boxes("rooftop_skyline_brick", materials.brick, skylineBrick); scene.boxes("rooftop_skyline_concrete", materials.concrete, skylineConcrete);

  const hvacBodies: InstanceTransform[] = []; const hvacVents: InstanceTransform[] = []; const ducts: InstanceTransform[] = [];
  const chimneys: InstanceTransform[] = [];
  for (let z = -4, index = 0; z > -112; z -= 22, index++) {
    const side = index % 2 ? -1 : 1; const x = side * 4.95;
    hvacBodies.push({ position: [x, .72, z], scale: [2.25, 1.28, 2.8], rotation: [0, side * .08, 0] });
    hvacVents.push({ position: [x - side * 1.14, .78, z], scale: [.12, .82, 1.7] });
    ducts.push({ position: [-side * 4.6, .48, z - 7], scale: [.38, 4.2, .38], rotation: [Math.PI / 2, 0, 0] });
    chimneys.push({ position: [side * 5.45, 1.5, z - 10], scale: [.42, 3, .42] });
  }
  scene.boxes("rooftop_hvac", ventMaterial, hvacBodies); scene.boxes("rooftop_hvac_vents", darkMetal, hvacVents); scene.cylinders("rooftop_ducts", ventMaterial, ducts); scene.cylinders("rooftop_chimneys", darkMetal, chimneys);

  const tankBodies: InstanceTransform[] = []; const tankLegs: InstanceTransform[] = []; const tankCaps: InstanceTransform[] = [];
  const cone = scene.track(new THREE.ConeGeometry(1, 1, 8));
  for (const [x, z] of [[-5.15, -31], [5.2, -77]] as Array<[number, number]>) {
    tankBodies.push({ position: [x, 2.25, z], scale: [1.35, 2.55, 1.35] }); tankCaps.push({ position: [x, 3.85, z], scale: [1.4, .72, 1.4] });
    for (const dx of [-.82, .82]) for (const dz of [-.72, .72]) tankLegs.push({ position: [x + dx, .72, z + dz], scale: [.16, 1.45, .16] });
  }
  scene.cylinders("rooftop_water_tanks", tankMaterial, tankBodies); scene.instances("rooftop_tank_caps", cone, tankMaterial, tankCaps); scene.boxes("rooftop_tank_legs", darkMetal, tankLegs);

  const antennaPoles: InstanceTransform[] = []; const antennaBars: InstanceTransform[] = [];
  const mastPositions: Array<[number, number]> = [[-4.3, -17], [4.6, -54], [-4.8, -94]];
  mastPositions.forEach(([x, z], index) => {
    antennaPoles.push({ position: [x, 3.15, z], scale: [.1, 6.3, .1] });
    for (let y = 2.3; y < 5.5; y += .9) antennaBars.push({ position: [x, y, z], scale: [2.2, .08, .08], rotation: [0, index * .28, 0] });
  });
  scene.cylinders("rooftop_antenna_masts", darkMetal, antennaPoles); scene.boxes("rooftop_antenna_bars", darkMetal, antennaBars);
  scene.line("rooftop_cable_1", [[-4.3, 5.7, -17], [0, 4.4, -36], [4.6, 5.7, -54]], 0x79708f, .72);
  scene.line("rooftop_cable_2", [[4.6, 5.55, -54], [0, 4.1, -75], [-4.8, 5.65, -94]], 0x79708f, .72);

  const ladderRails: InstanceTransform[] = []; const ladderRungs: InstanceTransform[] = [];
  for (const [side, z] of [[-1, -42], [1, -88]] as Array<[number, number]>) {
    for (const offset of [-.38, .38]) ladderRails.push({ position: [side * 6.55, 2.15, z + offset], scale: [.08, 4.3, .08] });
    for (let y = .45; y < 4.1; y += .55) ladderRungs.push({ position: [side * 6.55, y, z], scale: [.08, .08, .82] });
  }
  scene.cylinders("rooftop_ladder_rails", darkMetal, ladderRails); scene.boxes("rooftop_ladder_rungs", darkMetal, ladderRungs);

  const fixtures: InstanceTransform[] = [];
  for (let z = -3, index = 0; z > -112; z -= 24, index++) {
    const side = index % 2 ? -1 : 1; const x = side * 5.35; const color = index % 2 ? 0xff8a2a : 0xa45cff;
    fixtures.push({ position: [x, 1.65, z], scale: [.42, .28, 1.1] }); scene.pointLight(color, 8, 17, [x, 2.1, z]);
  }
  scene.boxes("rooftop_light_fixtures", lampMaterial, fixtures);
  for (const [index, z] of [-10, -52, -96].entries()) {
    const sign = scene.signMaterial(index % 2 ? 0xff8a2a : 0xa45cff, .9); scene.boxes(`rooftop_sign_${index}`, sign, [{ position: [index % 2 ? -7.48 : 7.48, 2.45, z], scale: [.15, 1.2, 3.1] }]);
  }
  return scene.finish();
}

export function buildArenaEnvironment(root: THREE.Group, materials: EnvironmentMaterialSet): EnvironmentBuildResult {
  const scene = new EnvironmentAssembler(root, materials);
  const voidMaterial = scene.plainMaterial({ color: 0x050103, roughness: 1 });
  const bannerMaterial = scene.material("roof", 0x6f1422, 0x2d0308, .08);
  const flameMaterial = scene.plainMaterial({ color: 0xffb23b, emissive: 0xff2b16, emissiveIntensity: 2.4, roughness: .45 });
  const darkMetal = scene.material("paintedMetal", 0x332126);
  scene.boxes("arena_floor", materials.concrete, [{ position: [0, -.06, -44], scale: [34, .12, 118] }]);
  scene.boxes("arena_outer_walls", materials.brick, [
    { position: [-14.2, 2.25, -44], scale: [3.4, 4.5, 112] },
    { position: [14.2, 2.25, -44], scale: [3.4, 4.5, 112] },
  ]);

  const columns: InstanceTransform[] = []; const columnCaps: InstanceTransform[] = []; const barriers: InstanceTransform[] = [];
  for (let z = 2; z > -98; z -= 14) for (const side of [-1, 1]) {
    columns.push({ position: [side * 10.8, 3.1, z], scale: [1.2, 6.2, 1.2] });
    columnCaps.push({ position: [side * 10.8, 6.2, z], scale: [1.65, .42, 1.65] });
    barriers.push({ position: [side * 9.15, 1.05, z - 3.8], scale: [.65, 2.1, 4.8] });
  }
  scene.boxes("arena_columns", materials.concrete, columns); scene.boxes("arena_column_caps", materials.brick, columnCaps); scene.boxes("arena_barriers", darkMetal, barriers);

  const braziers: InstanceTransform[] = []; const bowls: InstanceTransform[] = []; const flames: InstanceTransform[] = [];
  const bowlGeometry = scene.track(new THREE.ConeGeometry(1, .65, 8, 1, true)); const flameGeometry = scene.track(new THREE.ConeGeometry(1, 1, 7));
  for (let z = -8, index = 0; z > -94; z -= 26, index++) for (const side of [-1, 1]) {
    const x = side * 7.6; braziers.push({ position: [x, .9, z], scale: [.42, 1.8, .42] }); bowls.push({ position: [x, 1.85, z], scale: [.9, .62, .9] }); flames.push({ position: [x, 2.38, z], scale: [.42, 1.15, .42] });
    scene.pointLight(index % 2 ? 0xff2b22 : 0xffb000, 13, 20, [x, 2.5, z]);
  }
  scene.cylinders("arena_brazier_stands", darkMetal, braziers); scene.instances("arena_brazier_bowls", bowlGeometry, darkMetal, bowls); scene.instances("arena_flames", flameGeometry, flameMaterial, flames);

  const banners: InstanceTransform[] = [];
  for (let z = -6; z > -98; z -= 28) for (const side of [-1, 1]) banners.push({ position: [side * 12.38, 4.05, z], scale: [.12, 3.2, 2.1] });
  scene.boxes("arena_banners", bannerMaterial, banners);

  const rubble: InstanceTransform[] = [];
  for (let index = 0; index < 42; index++) {
    const side = index % 2 ? -1 : 1; const z = 5 - environment01(`arena:rubble:z:${index}`) * 104; const size = .22 + environment01(`arena:rubble:s:${index}`) * .48;
    rubble.push({ position: [side * (8.4 + environment01(`arena:rubble:x:${index}`) * 2.8), size * .35, z], scale: [size, size * .55, size * .8], rotation: [0, environment01(`arena:rubble:r:${index}`) * Math.PI, 0] });
  }
  scene.boxes("arena_rubble", materials.concrete, rubble);

  scene.boxes("arena_portal_void", voidMaterial, [{ position: [0, 4.15, -104.8], scale: [10.8, 8.3, .8] }]);
  scene.boxes("arena_portal", materials.concrete, [
    { position: [-6.65, 4.15, -103.5], scale: [2.25, 8.3, 3.2] },
    { position: [6.65, 4.15, -103.5], scale: [2.25, 8.3, 3.2] },
    { position: [0, 8.25, -103.5], scale: [15.5, 1.8, 3.2] },
  ]);
  const crownGeometry = scene.track(new THREE.ConeGeometry(1, 1, 6)); const crown: InstanceTransform[] = [];
  for (const x of [-5.4, -2.7, 0, 2.7, 5.4]) crown.push({ position: [x, 9.85 + (x === 0 ? .7 : 0), -103.5], scale: [.72, 1.65, .72] });
  scene.instances("arena_portal_crown", crownGeometry, materials.brick, crown);
  scene.boxes("arena_final_dais", darkMetal, [
    { position: [0, .22, -96], scale: [8.5, .42, 5.4] },
    { position: [0, .48, -98], scale: [5.8, .34, 2.4] },
  ]);
  return scene.finish();
}
