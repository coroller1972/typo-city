import * as THREE from "three";
import type { LevelEnvironment, LevelTheme } from "../simulation/types";

type AtmosphereProfile = {
  skyTop: number;
  skyBottom: number;
  particle: number;
  rain: boolean;
  motes: boolean;
  ash: boolean;
  lightning: boolean;
  wetness: number;
};

const profiles: Record<LevelEnvironment, AtmosphereProfile> = {
  street: { skyTop: 0x10172d, skyBottom: 0x355278, particle: 0x78dfff, rain: true, motes: false, ash: false, lightning: false, wetness: .12 },
  station: { skyTop: 0x020708, skyBottom: 0x102526, particle: 0xf3cf7a, rain: false, motes: true, ash: false, lightning: false, wetness: 0 },
  rooftop: { skyTop: 0x170f2c, skyBottom: 0x563275, particle: 0xcbb5ff, rain: true, motes: false, ash: false, lightning: true, wetness: .09 },
  arena: { skyTop: 0x100104, skyBottom: 0x5a1209, particle: 0xff8f38, rain: false, motes: true, ash: true, lightning: false, wetness: 0 },
};

export class AtmosphereController {
  private readonly root = new THREE.Group();
  private readonly skyMaterial: THREE.ShaderMaterial;
  private readonly sky: THREE.Mesh;
  private readonly rainPositions = new Float32Array(190 * 6);
  private readonly rainGeometry = new THREE.BufferGeometry();
  private readonly rainMaterial = new THREE.LineBasicMaterial({ color: 0x78dfff, transparent: true, opacity: .22, depthWrite: false });
  private readonly rain: THREE.LineSegments;
  private readonly motePositions = new Float32Array(150 * 3);
  private readonly moteSpeeds = new Float32Array(150);
  private readonly moteGeometry = new THREE.BufferGeometry();
  private readonly moteMaterial = new THREE.PointsMaterial({ color: 0xf3cf7a, size: .075, transparent: true, opacity: .46, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  private readonly motes: THREE.Points;
  private readonly lightning = new THREE.PointLight(0xd8e4ff, 0, 145, 1.25);
  private readonly wetMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9dc9df, transparent: true, opacity: 0, roughness: .18, metalness: .08, clearcoat: 1, clearcoatRoughness: .2, depthWrite: false });
  private readonly wetSurface = new THREE.Mesh(new THREE.PlaneGeometry(26, 150), this.wetMaterial);
  private environment: LevelEnvironment = "street";
  private profile = profiles.street;

  constructor(scene: THREE.Scene) {
    this.root.name = "atmosphere";
    this.skyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { topColor: { value: new THREE.Color(this.profile.skyTop) }, bottomColor: { value: new THREE.Color(this.profile.skyBottom) } },
      vertexShader: "varying float vHeight; void main(){ vHeight = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 topColor; uniform vec3 bottomColor; varying float vHeight; void main(){ float t = smoothstep(-0.18, 0.72, vHeight); gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0); }",
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(145, 20, 12), this.skyMaterial);
    this.sky.frustumCulled = false;

    for (let index = 0; index < 190; index++) this.resetRain(index, 11 - seeded01(`rain:z:${index}`) * 145, seeded01(`rain:y:${index}`) * 12);
    this.rainGeometry.setAttribute("position", new THREE.BufferAttribute(this.rainPositions, 3));
    this.rain = new THREE.LineSegments(this.rainGeometry, this.rainMaterial); this.rain.frustumCulled = false;

    for (let index = 0; index < 150; index++) {
      this.motePositions[index * 3] = (seeded01(`mote:x:${index}`) - .5) * 24;
      this.motePositions[index * 3 + 1] = .35 + seeded01(`mote:y:${index}`) * 8;
      this.motePositions[index * 3 + 2] = 12 - seeded01(`mote:z:${index}`) * 145;
      this.moteSpeeds[index] = .18 + seeded01(`mote:s:${index}`) * .55;
    }
    this.moteGeometry.setAttribute("position", new THREE.BufferAttribute(this.motePositions, 3));
    this.motes = new THREE.Points(this.moteGeometry, this.moteMaterial); this.motes.frustumCulled = false;

    this.wetSurface.rotation.x = -Math.PI / 2; this.wetSurface.position.set(0, .035, -53); this.wetSurface.renderOrder = 1;
    this.lightning.position.set(0, 24, -32);
    this.root.add(this.sky, this.rain, this.motes, this.wetSurface, this.lightning); scene.add(this.root);
    this.configure("street");
  }

  configure(environment: LevelEnvironment, theme?: LevelTheme): void {
    this.environment = environment; this.profile = profiles[environment];
    const top = new THREE.Color(this.profile.skyTop); const bottom = new THREE.Color(this.profile.skyBottom);
    if (theme) bottom.lerp(new THREE.Color(theme.fog), .28);
    this.skyMaterial.uniforms.topColor.value.copy(top); this.skyMaterial.uniforms.bottomColor.value.copy(bottom);
    this.rain.visible = this.profile.rain; this.motes.visible = this.profile.motes; this.wetSurface.visible = this.profile.wetness > 0;
    this.rainMaterial.color.setHex(this.profile.particle); this.rainMaterial.opacity = environment === "rooftop" ? .36 : .3;
    this.moteMaterial.color.setHex(this.profile.particle); this.moteMaterial.size = this.profile.ash ? .1 : .065; this.moteMaterial.opacity = this.profile.ash ? .58 : .35;
    this.wetMaterial.opacity = this.profile.wetness; this.wetMaterial.color.setHex(theme?.neonSecondary ?? this.profile.particle);
    this.lightning.intensity = 0;
  }

  update(camera: THREE.Camera, deltaMs: number, elapsedMs: number): void {
    const delta = Math.min(deltaMs, 50) / 1000;
    this.sky.position.set(camera.position.x, camera.position.y - 8, camera.position.z - 12);
    this.lightning.position.set(camera.position.x, 22, camera.position.z - 34);
    if (this.rain.visible) this.updateRain(camera.position.z, delta);
    if (this.motes.visible) this.updateMotes(camera.position.z, delta, elapsedMs);
    if (this.profile.lightning) {
      const phase = (elapsedMs + 3100) % 8300;
      const flash = phase < 130 ? 1 : phase > 185 && phase < 335 ? .42 : 0;
      this.lightning.intensity = flash * 78;
      this.skyMaterial.uniforms.topColor.value.setHex(flash ? 0x413f72 : this.profile.skyTop);
    }
  }

  private updateRain(cameraZ: number, delta: number): void {
    for (let index = 0; index < 190; index++) {
      const offset = index * 6; let y = this.rainPositions[offset + 1] - delta * 17; let z = this.rainPositions[offset + 2];
      if (y < .2) y += 11.8;
      if (z > cameraZ + 16) z -= 140;
      if (z < cameraZ - 124) z += 140;
      this.setRainSegment(offset, this.rainPositions[offset], y, z);
    }
    this.rainGeometry.attributes.position.needsUpdate = true;
  }

  private updateMotes(cameraZ: number, delta: number, elapsedMs: number): void {
    for (let index = 0; index < 150; index++) {
      const offset = index * 3; const direction = this.profile.ash ? 1 : -.18;
      this.motePositions[offset] += Math.sin(elapsedMs * .00045 + index) * delta * .08;
      this.motePositions[offset + 1] += this.moteSpeeds[index] * direction * delta;
      if (this.profile.ash && this.motePositions[offset + 1] > 9) this.motePositions[offset + 1] = .25;
      if (!this.profile.ash && this.motePositions[offset + 1] < .2) this.motePositions[offset + 1] = 8.4;
      if (this.motePositions[offset + 2] > cameraZ + 16) this.motePositions[offset + 2] -= 140;
      if (this.motePositions[offset + 2] < cameraZ - 124) this.motePositions[offset + 2] += 140;
    }
    this.moteGeometry.attributes.position.needsUpdate = true;
  }

  private resetRain(index: number, z: number, y: number): void {
    const offset = index * 6; const x = (seeded01(`rain:x:${index}`) - .5) * 24; this.setRainSegment(offset, x, y, z);
  }
  private setRainSegment(offset: number, x: number, y: number, z: number): void {
    this.rainPositions[offset] = x; this.rainPositions[offset + 1] = y; this.rainPositions[offset + 2] = z;
    this.rainPositions[offset + 3] = x + .07; this.rainPositions[offset + 4] = y - .6; this.rainPositions[offset + 5] = z + .12;
  }
}

function seeded01(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) { hash ^= key.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}
