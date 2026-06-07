import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

globalThis.FileReader = class {
  result = null;
  onloadend = null;
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((value) => { this.result = value; this.onloadend?.(); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((value) => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString("base64")}`; this.onloadend?.(); }); }
};

const exporter = new GLTFExporter();
const out = "public/assets";
await mkdir(`${out}/characters`, { recursive: true });
await mkdir(`${out}/environment`, { recursive: true });
await mkdir(`${out}/textures`, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
const crc32 = (buffer) => {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const name = Buffer.from(type); const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
};
const seeded = (x, y, seed = 1) => {
  let value = Math.imul(x + seed * 17, 374761393) + Math.imul(y + seed * 29, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177); return ((value ^ (value >>> 16)) >>> 0) / 0xffffffff;
};
const shade = (color, amount) => color.map((value) => Math.max(0, Math.min(255, Math.round(value * amount))));
const texture = async (name, width, height, painter) => {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a = 255] = painter(x, y);
      const offset = y * (width * 4 + 1) + x * 4 + 1; raw[offset] = r; raw[offset + 1] = g; raw[offset + 2] = b; raw[offset + 3] = a;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 6;
  await writeFile(`${out}/textures/${name}.png`, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
};

await texture("asphalt", 64, 64, (x, y) => {
  const base = shade([47, 59, 82], .72 + seeded(x, y, 3) * .22); const crack = (x + y * 3) % 47 === 0;
  return crack ? shade(base, .48) : base;
});
await texture("facade", 64, 64, (x, y) => {
  const mortar = y % 12 < 2 || (x + (Math.floor(y / 12) % 2) * 8) % 22 < 2; const base = mortar ? [32, 42, 67] : shade([55, 67, 96], .78 + seeded(x, y, 5) * .24);
  return x % 31 === 0 ? shade(base, .72) : base;
});
await texture("cloth", 32, 32, (x, y) => shade([61, 80, 105], .72 + seeded(x, y, 7) * .3 + ((x + y) % 9 === 0 ? .12 : 0)));
await texture("skin", 32, 32, (x, y) => shade([129, 165, 137], .76 + seeded(x, y, 11) * .28 + (x % 13 === 0 ? -.14 : 0)));
await texture("runner-skin", 32, 32, (x, y) => shade([208, 91, 139], .76 + seeded(x, y, 13) * .27 + (y % 11 === 0 ? -.13 : 0)));
await texture("brute-skin", 32, 32, (x, y) => shade([184, 147, 105], .74 + seeded(x, y, 17) * .29 + ((x + y) % 15 === 0 ? -.16 : 0)));
await texture("boss-skin", 32, 32, (x, y) => shade([150, 91, 194], .76 + seeded(x, y, 19) * .28 + ((x - y + 32) % 12 === 0 ? .15 : 0)));
await texture("metal", 32, 32, (x, y) => shade([67, 83, 111], .7 + seeded(x, y, 23) * .3 + (x % 9 === 0 ? .15 : 0)));
await texture("stone", 32, 32, (x, y) => shade([68, 76, 99], .72 + seeded(x, y, 29) * .24 + ((x + y) % 14 === 0 ? -.14 : 0)));

const mat = (name, color, emissive = 0x000000) => new THREE.MeshStandardMaterial({ name, color, emissive, emissiveIntensity: .48, roughness: .74, metalness: .03 });
const add = (root, name, geometry, material, position, rotation = [0, 0, 0]) => {
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh); return mesh;
};
const box = (x, y, z) => new THREE.BoxGeometry(x, y, z);
const sphere = (r, w = 7, h = 5) => new THREE.SphereGeometry(r, w, h);
const cylinder = (a, b, h, s = 6) => new THREE.CylinderGeometry(a, b, h, s);
const cone = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s);

function character(archetype) {
  const root = new THREE.Group(); root.name = archetype; const skin = mat("skin", 0x83a98a, 0x183b28); const cloth = mat("cloth", 0x3b526b, 0x101a2b); const eye = mat("eyes", 0xff557b, 0xff174e);
  if (archetype === "walker") {
    add(root, "body", box(1.35, 1.8, .72), cloth, [0, 1.8, 0]); add(root, "head", sphere(.67), skin, [0, 3.15, .02]);
    add(root, "arm_l", box(.34, 1.9, .34), skin, [-.91, 1.82, .25], [-.25, 0, -.18]); add(root, "arm_r", box(.34, 1.9, .34), skin, [.91, 1.82, .25], [-.25, 0, .18]);
    add(root, "leg_l", box(.45, 1.55, .48), cloth, [-.36, .76, 0]); add(root, "leg_r", box(.45, 1.55, .48), cloth, [.36, .76, 0]);
    add(root, "eye_l", box(.13, .1, .08), eye, [-.23, 3.25, .63]); add(root, "eye_r", box(.13, .1, .08), eye, [.23, 3.25, .63]);
  } else if (archetype === "runner") {
    const runnerSkin = mat("runner_skin", 0xd96391, 0x50193a); add(root, "body", box(1.05, 1.35, .62), cloth, [0, 1.43, 0], [.24, 0, 0]); add(root, "head", sphere(.53), runnerSkin, [0, 2.58, .35]);
    add(root, "arm_l", box(.25, 1.56, .25), runnerSkin, [-.66, 1.45, .26], [-.72, 0, -.35]); add(root, "arm_r", box(.25, 1.56, .25), runnerSkin, [.66, 1.45, .26], [-.72, 0, .35]);
    add(root, "leg_l", box(.34, 1.48, .36), cloth, [-.27, .7, -.1], [-.23, 0, 0]); add(root, "leg_r", box(.34, 1.48, .36), cloth, [.27, .7, .1], [.23, 0, 0]);
    add(root, "eye_l", box(.11, .09, .07), eye, [-.18, 2.69, .84]); add(root, "eye_r", box(.11, .09, .07), eye, [.18, 2.69, .84]);
  } else if (archetype === "brute") {
    const bruteSkin = mat("brute_skin", 0xb89369, 0x452b17); add(root, "body", box(2.45, 2.55, 1.2), cloth, [0, 2.17, 0]); add(root, "head", box(1.55, 1.32, 1.12), bruteSkin, [0, 4.04, .08]);
    add(root, "arm_l", box(.72, 2.85, .72), bruteSkin, [-1.68, 2.08, .15], [0, 0, -.12]); add(root, "arm_r", box(.72, 2.85, .72), bruteSkin, [1.68, 2.08, .15], [0, 0, .12]);
    add(root, "leg_l", box(.72, 1.68, .8), cloth, [-.7, .8, 0]); add(root, "leg_r", box(.72, 1.68, .8), cloth, [.7, .8, 0]);
    add(root, "eye_l", box(.19, .13, .08), eye, [-.38, 4.12, .67]); add(root, "eye_r", box(.19, .13, .08), eye, [.38, 4.12, .67]);
  } else {
    const bossSkin = mat("boss_skin", 0x9961c4, 0x4d216b); add(root, "body", cylinder(1.8, 2.42, 4.35, 7), bossSkin, [0, 3.02, 0]); add(root, "head", sphere(1.52, 7, 5), bossSkin, [0, 5.95, .05]);
    for (let i = 0; i < 4; i++) { const side = i < 2 ? -1 : 1; add(root, `arm_${i}`, cylinder(.32, .55, 3.65, 6), bossSkin, [side * (2.05 + (i % 2) * .42), 3.25 - (i % 2) * .62, .15], [0, 0, side * (.38 + (i % 2) * .22)]); }
    add(root, "leg_l", box(.85, 2.08, .92), bossSkin, [-.86, 1.0, 0]); add(root, "leg_r", box(.85, 2.08, .92), bossSkin, [.86, 1.0, 0]);
    for (const [x, y] of [[-.58, 6.2], [0, 6.43], [.58, 6.2]]) add(root, `eye_${x}`, sphere(.16, 6, 4), eye, [x, y, 1.43]);
    for (const [x, z] of [[-1.3, -.2], [0, -.6], [1.3, -.2]]) add(root, `spike_${x}`, cone(.38, 1.35, 5), bossSkin, [x, 7.35, z]);
  }
  return root;
}

function propKit() {
  const root = new THREE.Group(); root.name = "city_kit"; const steel = mat("steel", 0x263448); const pink = mat("neon_pink", 0xff3e72, 0xff2d72); const cyan = mat("neon_cyan", 0x58d9ed, 0x36c7ff); const stone = mat("stone", 0x2b3040);
  const lamp = new THREE.Group(); lamp.name = "streetlamp"; add(lamp, "pole", cylinder(.1, .14, 4.6, 6), steel, [0, 2.3, 0]); add(lamp, "lamp", box(.85, .28, .42), cyan, [0, 4.52, 0]); lamp.position.x = -4; root.add(lamp);
  const shelter = new THREE.Group(); shelter.name = "bus_shelter"; add(shelter, "back", box(3.6, 2.6, .12), steel, [0, 1.3, 0]); add(shelter, "roof", box(3.9, .16, 1.3), pink, [0, 2.62, .54]); add(shelter, "bench", box(2.8, .32, .55), stone, [0, .65, .46]); shelter.position.x = 2.5; root.add(shelter);
  for (let i = 0; i < 4; i++) add(root, `debris_${i}`, box(.4 + i * .12, .18 + i * .04, .52), stone, [-2 + i * .76, .13, -2.2 - i * .26], [0, i * .45, 0]);
  return root;
}

async function save(name, object, folder) {
  const data = await exporter.parseAsync(object, { binary: true, onlyVisible: true });
  await writeFile(`${out}/${folder}/${name}.glb`, Buffer.from(data));
}
for (const name of ["walker", "runner", "brute", "boss"]) await save(name, character(name), "characters");
await save("city-kit", propKit(), "environment");
await writeFile(`${out}/catalog.json`, JSON.stringify({ characters: ["walker", "runner", "brute", "boss"], environment: ["city-kit"], textures: ["asphalt", "facade", "cloth", "skin", "runner-skin", "brute-skin", "boss-skin", "metal", "stone"], generated: true }, null, 2));
console.log("Generated original low-poly GLB asset pack.");
