import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import type { EnemyArchetype, EnemyState, GameState, InputFeedback, InputFeedbackKind, LevelEnvironment, LevelTheme } from "../simulation/types";
import { assetManifest, textureManifest, type AssetKey, type TextureKey } from "./assets";
type EnemyView = { group: THREE.Group; label: HTMLDivElement; pulse: number; archetype: EnemyArchetype; baseScale: number; labelHeight: number; hitMs: number; killMs: number; labelMs: number; labelKind?: InputFeedbackKind; impactLight: THREE.PointLight; mixer?: THREE.AnimationMixer };
const zombieVariants: Partial<Record<EnemyArchetype, { material: string; scale: number; facing: number; labelHeight: number; speed: number; glow?: number }>> = {
  walker: { material: "Cartoon_zombie1_Bake", scale: 2.45, facing: Math.PI, labelHeight: 3.8, speed: .78, glow: .08 },
  runner: { material: "Cartoon_zombie5_female_Bake", scale: 2.35, facing: Math.PI, labelHeight: 3.35, speed: 1.18, glow: .08 },
  brute: { material: "Obese_Police_Zombie1_Bake", scale: 3.05, facing: 0, labelHeight: 4.25, speed: .66, glow: .1 },
  boss: { material: "Obese_Police_Zombie2_Bake", scale: 3.75, facing: Math.PI, labelHeight: 6.6, speed: .34, glow: .14 },
};
export class World {
  readonly renderer = new THREE.WebGLRenderer({ antialias: true });
  private readonly scene = new THREE.Scene(); private readonly camera = new THREE.PerspectiveCamera(58, 1, .1, 180);
  private readonly playerLight = new THREE.PointLight(0xb7d9ff, 24, 48, 1.45);
  private readonly ambientLight = new THREE.AmbientLight(0x95a8d8, 3.55);
  private readonly hemisphereLight = new THREE.HemisphereLight(0xa7b9ff, 0x1b1d2d, 2.35);
  private readonly neonLight = new THREE.PointLight(0xff2d72, 36, 42);
  private readonly blueLight = new THREE.PointLight(0x36c7ff, 34, 48);
  private readonly loader = new GLTFLoader(); private readonly textureLoader = new THREE.TextureLoader(); private readonly models = new Map<AssetKey, THREE.Group>(); private readonly animations = new Map<AssetKey, THREE.AnimationClip[]>(); private readonly textures = new Map<TextureKey, THREE.Texture>();
  private readonly environmentRoot = new THREE.Group();
  private readonly groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2538, roughness: 1 });
  private readonly buildingMaterial = new THREE.MeshStandardMaterial({ color: 0x27314a, roughness: .92 });
  private readonly streetLights: THREE.PointLight[] = [];
  private readonly signMaterials: THREE.MeshBasicMaterial[] = [];
  private readonly labelAnchor = new THREE.Vector3();
  private readonly enemyViews = new Map<string, EnemyView>(); private waveIndex = -1; private cameraTargetZ = 11;
  private readonly pendingFeedback = new Map<string, InputFeedback>();
  private currentThemeId = "";
  private currentTheme?: LevelTheme;
  private currentEnvironment?: LevelEnvironment;
  constructor(private readonly labels: HTMLElement) {
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); this.renderer.shadowMap.enabled = true; this.renderer.outputColorSpace = THREE.SRGBColorSpace; this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.42;
    this.scene.background = new THREE.Color(0x0c1022); this.scene.fog = new THREE.Fog(0x0c1022, 33, 105);
    this.camera.position.set(0, 4.5, 11); this.camera.lookAt(0, 2, -12); this.playerLight.position.set(0, 6, 6); this.scene.add(this.environmentRoot, this.playerLight, this.ambientLight, this.hemisphereLight, this.neonLight, this.blueLight); this.buildEnvironment("street"); void this.preloadAssets(); this.resize(); window.addEventListener("resize", () => this.resize());
  }
  update(state: GameState, deltaMs: number): void {
    const environmentChanged = state.levelEnvironment !== this.currentEnvironment;
    if (environmentChanged) this.buildEnvironment(state.levelEnvironment);
    if (state.levelTheme.id !== this.currentThemeId || environmentChanged) this.applyTheme(state.levelTheme);
    if (state.waveIndex !== this.waveIndex) { this.waveIndex = state.waveIndex; this.cameraTargetZ = 11 - Math.max(0, state.waveIndex) * 17; }
    this.camera.position.z += (this.cameraTargetZ - this.camera.position.z) * Math.min(1, deltaMs / 1100); this.camera.lookAt(0, 2, this.camera.position.z - 18); this.playerLight.position.set(0, 6.5, this.camera.position.z - 2);
    const active = new Set(state.enemies.map((enemy) => enemy.id));
    for (const [id, view] of this.enemyViews) if (!active.has(id)) {
      this.advanceFeedback(view, deltaMs);
      if (view.killMs > 0) { this.syncDefeatedEnemy(view); continue; }
      this.disposeEnemyView(id, view);
    }
    for (const enemy of state.enemies) this.syncEnemy(enemy, state.lockedEnemyId === enemy.id, deltaMs);
    this.renderer.render(this.scene, this.camera);
  }
  flash(kind: "hit" | "kill" = "hit"): void {
    const className = kind === "kill" ? "kill-flash" : "hit-flash";
    document.body.classList.remove("hit-flash", "kill-flash");
    requestAnimationFrame(() => {
      document.body.classList.add(className);
      window.setTimeout(() => document.body.classList.remove(className), kind === "kill" ? 170 : 90);
    });
  }
  registerInputFeedback(feedback: InputFeedback): void {
    if (!feedback.enemyId || feedback.kind === "error") return;
    const view = this.enemyViews.get(feedback.enemyId);
    if (view) this.applyInputFeedback(view, feedback);
    else this.pendingFeedback.set(feedback.enemyId, feedback);
  }
  private syncEnemy(enemy: EnemyState, locked: boolean, deltaMs: number): void {
    let view = this.enemyViews.get(enemy.id); if (!view) { view = this.createEnemy(enemy); this.enemyViews.set(enemy.id, view); }
    const pending = this.pendingFeedback.get(enemy.id); if (pending) { this.applyInputFeedback(view, pending); this.pendingFeedback.delete(enemy.id); }
    this.advanceFeedback(view, deltaMs);
    const hitT = view.hitMs / 170; const killT = view.killMs / 520; const bossDamp = enemy.archetype === "boss" ? .42 : 1;
    const shake = Math.sin(view.pulse * .17 + enemy.lane * 9) * hitT * .045 * bossDamp;
    const recoil = (hitT * .95 + killT * 1.8) * bossDamp;
    const lift = killT > 0 ? Math.sin((1 - killT) * Math.PI) * .45 * bossDamp : 0;
    view.group.position.set(enemy.lane + shake, 0, this.camera.position.z - enemy.distance - recoil); view.group.rotation.y = Math.sin(performance.now() / 400 + enemy.lane) * .08 + shake * .65; view.pulse += deltaMs; view.mixer?.update(deltaMs / 1000); if (!view.mixer) this.animateEnemy(view);
    view.group.position.y += lift;
    const pulseScale = locked && enemy.archetype !== "boss" ? 1 + Math.sin(view.pulse / 80) * .035 : 1; const impactScale = 1 + hitT * .055 + killT * .18; view.group.scale.setScalar(view.baseScale * pulseScale * impactScale);
    this.syncImpactLight(view);
    const word = enemy.words[enemy.activeWordIndex]; view.label.innerHTML = `<span>${word.slice(0, enemy.typedLength)}</span>${word.slice(enemy.typedLength)}`;
    view.label.className = `enemy-label ${locked ? "locked" : ""} ${view.labelMs > 0 ? view.labelKind : ""} ${enemy.archetype === "boss" ? "boss-label" : ""}`; this.positionLabel(view, enemy.labelOffset, enemy.labelScreenOffset);
  }
  private createEnemy(enemy: EnemyState): EnemyView {
    const phase = this.animationPhase(enemy);
    const packed = this.createPackedZombie(enemy.archetype, phase);
    const loaded = this.models.get(`enemy.${enemy.archetype}` as AssetKey); const group = packed?.group ?? loaded?.clone(true) ?? this.createFallbackEnemy(enemy.archetype);
    const impactLight = new THREE.PointLight(0x65e5f4, 0, 7, 2.2); impactLight.position.set(0, packed?.labelHeight ? packed.labelHeight * .45 : 2.4, .8); group.add(impactLight);
    this.scene.add(group); const label = document.createElement("div"); this.labels.append(label); return { group, label, pulse: phase * 1000, archetype: enemy.archetype, baseScale: packed?.baseScale ?? 1, labelHeight: packed?.labelHeight ?? this.enemyStyle(enemy.archetype).height + 1.3, hitMs: 0, killMs: 0, labelMs: 0, impactLight, mixer: packed?.mixer };
  }
  private applyInputFeedback(view: EnemyView, feedback: InputFeedback): void {
    view.hitMs = Math.max(view.hitMs, feedback.kind === "kill" ? 240 : feedback.wordComplete ? 190 : 150);
    view.labelMs = Math.max(view.labelMs, feedback.kind === "kill" ? 380 : 170);
    view.labelKind = feedback.kind;
    view.impactLight.color.setHex(feedback.kind === "kill" ? 0xff507d : feedback.wordComplete ? 0xffe16a : 0x65e5f4);
    view.impactLight.intensity = Math.max(view.impactLight.intensity, feedback.kind === "kill" ? 16 : feedback.wordComplete ? 10 : 7);
    if (feedback.kind === "kill") view.killMs = Math.max(view.killMs, 520);
  }
  private advanceFeedback(view: EnemyView, deltaMs: number): void {
    view.hitMs = Math.max(0, view.hitMs - deltaMs);
    view.killMs = Math.max(0, view.killMs - deltaMs);
    view.labelMs = Math.max(0, view.labelMs - deltaMs);
  }
  private syncImpactLight(view: EnemyView): void {
    const hitT = view.hitMs / 170; const killT = view.killMs / 520;
    view.impactLight.intensity = Math.max(view.impactLight.intensity * .72, hitT * 7 + killT * 16);
  }
  private syncDefeatedEnemy(view: EnemyView): void {
    const killT = view.killMs / 520;
    view.group.scale.setScalar(view.baseScale * (1 + killT * .22));
    view.group.position.y += (1 - killT) * .018;
    view.group.rotation.z = Math.sin((1 - killT) * Math.PI) * .1;
    this.syncImpactLight(view);
    view.label.className = `enemy-label kill ${view.archetype === "boss" ? "boss-label" : ""}`;
    view.label.style.opacity = String(Math.max(0, killT));
  }
  private disposeEnemyView(id: string, view: EnemyView): void { view.label.remove(); this.scene.remove(view.group); this.enemyViews.delete(id); }
  private createPackedZombie(archetype: EnemyArchetype, phase: number): { group: THREE.Group; mixer?: THREE.AnimationMixer; baseScale: number; labelHeight: number } | undefined {
    const source = this.models.get("vendor.zombie-pack"); const config = zombieVariants[archetype]; if (!source || !config) return undefined;
    const scene = SkeletonUtils.clone(source) as THREE.Group; const selectedMeshes: THREE.Mesh[] = [];
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true; object.receiveShadow = true; object.frustumCulled = false;
      const materialName = Array.isArray(object.material) ? object.material[0]?.name : object.material.name;
      const visible = materialName === config.material; object.visible = visible; if (visible) selectedMeshes.push(object);
      if (object.material instanceof THREE.MeshStandardMaterial) {
        object.material.roughness = .86; object.material.metalness = 0; object.material.emissive = new THREE.Color(archetype === "boss" ? 0x1f4f72 : 0x182844); object.material.emissiveIntensity = visible ? config.glow ?? .08 : .02;
      }
    });
    if (!selectedMeshes.length) return undefined;
    const box = new THREE.Box3(); for (const mesh of selectedMeshes) box.expandByObject(mesh);
    const size = new THREE.Vector3(); const center = new THREE.Vector3(); box.getSize(size); box.getCenter(center);
    const wrapper = new THREE.Group(); wrapper.name = `${archetype}_packed_zombie`; scene.position.set(-center.x, -box.min.y, -center.z); scene.rotation.y = config.facing; wrapper.add(scene);
    wrapper.scale.setScalar(config.scale);
    if (archetype === "boss") { const bossLight = new THREE.PointLight(0x75d7ff, 2.2, 7, 1.9); bossLight.position.set(0, 3, 1.2); wrapper.add(bossLight); }
    const clips = this.animations.get("vendor.zombie-pack") ?? []; const sourceClip = clips.find((item) => item.name !== "CameraAction") ?? clips[0];
    const clip = sourceClip ? this.clipForSelectedSkeleton(sourceClip, selectedMeshes[0], archetype) : undefined;
    let mixer: THREE.AnimationMixer | undefined;
    if (clip) { mixer = new THREE.AnimationMixer(scene); const action = mixer.clipAction(clip); action.timeScale = config.speed; action.play(); action.time = phase * clip.duration; mixer.update(0); }
    return { group: wrapper, mixer, baseScale: config.scale, labelHeight: config.labelHeight };
  }
  private animationPhase(enemy: EnemyState): number {
    const key = `${enemy.id}:${enemy.archetype}:${enemy.lane}:${enemy.distance}:${enemy.words.join("/")}`;
    let hash = 2166136261;
    for (let index = 0; index < key.length; index++) { hash ^= key.charCodeAt(index); hash = Math.imul(hash, 16777619); }
    return (hash >>> 0) / 4294967295;
  }
  private clipForSelectedSkeleton(clip: THREE.AnimationClip, mesh: THREE.Mesh, archetype: EnemyArchetype): THREE.AnimationClip | undefined {
    if (!(mesh instanceof THREE.SkinnedMesh)) return undefined;
    const boneNames = new Set(mesh.skeleton.bones.map((bone) => bone.name));
    const rootName = mesh.skeleton.bones[0]?.name;
    const bossStableTorso = /(?:Hip|Pelvis|Waist|Spine)/;
    const tracks = clip.tracks.filter((track) => {
      const [target, property] = track.name.split(".");
      if (!boneNames.has(target)) return false;
      if (archetype === "boss" && bossStableTorso.test(target)) return false;
      return property === "quaternion" && target !== rootName;
    });
    return tracks.length ? new THREE.AnimationClip(`${clip.name}_${mesh.name}_in_place`, clip.duration, tracks) : undefined;
  }
  private createFallbackEnemy(archetype: EnemyArchetype): THREE.Group {
    const group = new THREE.Group(); const style = this.enemyStyle(archetype);
    const material = new THREE.MeshStandardMaterial({ color: style.color, roughness: .72, emissive: style.emissive, emissiveIntensity: .35 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(style.width, style.height, style.width * .75), material); body.position.y = style.height / 2; body.castShadow = true; group.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(style.width * .72, style.width * .72, style.width * .72), material); head.position.y = style.height + style.width * .3; head.castShadow = true; group.add(head);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xff375f });
    for (const x of [-.18, .18]) { const eye = new THREE.Mesh(new THREE.BoxGeometry(.12, .12, .08), eyeMaterial); eye.position.set(x * style.width, head.position.y + .05, style.width * .39); group.add(eye); }
    return group;
  }
  private animateEnemy(view: EnemyView): void {
    const pace = view.archetype === "runner" ? 72 : view.archetype === "boss" ? 180 : 125; const cycle = Math.sin(view.pulse / pace);
    view.group.position.y = Math.abs(cycle) * (view.archetype === "boss" ? .12 : .2);
    const left = view.group.getObjectByName("arm_l"), right = view.group.getObjectByName("arm_r");
    if (left) left.rotation.x = -.2 + cycle * .36; if (right) right.rotation.x = -.2 - cycle * .36;
    const legLeft = view.group.getObjectByName("leg_l"), legRight = view.group.getObjectByName("leg_r");
    if (legLeft) legLeft.rotation.x = cycle * .2; if (legRight) legRight.rotation.x = -cycle * .2;
  }
  private async preloadAssets(): Promise<void> {
    await this.preloadTextures();
    await Promise.all((Object.entries(assetManifest) as Array<[AssetKey, { url: string }]>).map(async ([key, asset]) => {
      try { const gltf = await this.loader.loadAsync(asset.url); this.applyModelTextures(gltf.scene); this.models.set(key, gltf.scene); this.animations.set(key, gltf.animations); } catch { console.warn(`Asset fallback used for ${key}`); }
    }));
    const kit = this.models.get("environment.city-kit"); if (!kit) return;
    this.placeKitProps(kit);
  }
  private async preloadTextures(): Promise<void> {
    await Promise.all((Object.entries(textureManifest) as Array<[TextureKey, string]>).map(async ([key, url]) => {
      try {
        const texture = await this.textureLoader.loadAsync(url); texture.colorSpace = THREE.SRGBColorSpace; texture.magFilter = THREE.NearestFilter; texture.minFilter = THREE.NearestMipmapNearestFilter; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; this.textures.set(key, texture);
      } catch { console.warn(`Texture fallback used for ${key}`); }
    }));
    this.applyTexture(this.groundMaterial, "asphalt", 4, 24); this.applyTexture(this.buildingMaterial, "facade", 2, 3);
    if (this.currentTheme) this.applyTheme(this.currentTheme);
  }
  private applyModelTextures(root: THREE.Group): void {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      const material = object.material;
      if (material instanceof THREE.MeshStandardMaterial && material.name in textureManifest) this.applyTexture(material, material.name as TextureKey);
    });
  }
  private applyTexture(material: THREE.MeshStandardMaterial, key: TextureKey, repeatX = 1, repeatY = 1): void {
    const texture = this.textures.get(key); if (!texture) return; const map = texture.clone(); map.repeat.set(repeatX, repeatY); map.needsUpdate = true; material.map = map; material.color.setHex(0xffffff); material.needsUpdate = true;
  }
  private positionLabel(view: EnemyView, offset: { x: number; y: number } = { x: 0, y: 0 }, screenOffset: { x: number; y: number } = { x: 0, y: 0 }): void {
    const top = this.labelAnchor.copy(view.group.position).add(new THREE.Vector3(offset.x, view.labelHeight + offset.y, 0));
    top.project(this.camera);
    const x = Math.min(innerWidth - 118, Math.max(118, (top.x * .5 + .5) * innerWidth + screenOffset.x));
    const y = Math.min(innerHeight - 104, Math.max(86, (-top.y * .5 + .5) * innerHeight + screenOffset.y));
    view.label.style.left = `${x}px`;
    view.label.style.top = `${y}px`;
    view.label.style.transform = "translate(-50%, -100%)";
    view.label.style.opacity = top.z < 1 && top.x > -1.12 && top.x < 1.12 && top.y > -1.45 ? "1" : "0";
  }
  private enemyStyle(archetype: EnemyArchetype) { return {
    walker: { color: 0x668c6d, emissive: 0x102b1c, width: 1.6, height: 2.4 }, runner: { color: 0xab4776, emissive: 0x351128, width: 1.25, height: 2 },
    brute: { color: 0x8d7254, emissive: 0x2d1d10, width: 2.7, height: 3.3 }, boss: { color: 0x7342a1, emissive: 0x291144, width: 4.2, height: 5.7 },
  }[archetype]; }
  private applyTheme(theme: LevelTheme): void {
    this.currentThemeId = theme.id;
    this.currentTheme = theme;
    this.renderer.toneMappingExposure = theme.exposure;
    this.scene.background = new THREE.Color(theme.background);
    this.scene.fog = new THREE.Fog(theme.fog, theme.fogNear, theme.fogFar);
    this.groundMaterial.color.setHex(theme.ground);
    this.buildingMaterial.color.setHex(theme.buildings);
    this.ambientLight.color.setHex(theme.ambientLight);
    this.ambientLight.intensity = theme.ambientIntensity;
    this.hemisphereLight.color.setHex(theme.hemisphereSky);
    this.hemisphereLight.groundColor.setHex(theme.hemisphereGround);
    this.hemisphereLight.intensity = theme.hemisphereIntensity;
    this.playerLight.color.setHex(theme.playerLight);
    this.playerLight.intensity = theme.playerLightIntensity;
    this.neonLight.color.setHex(theme.neonPrimary);
    this.neonLight.intensity = theme.neonPrimaryIntensity;
    this.blueLight.color.setHex(theme.neonSecondary);
    this.blueLight.intensity = theme.neonSecondaryIntensity;
    this.streetLights.forEach((light, index) => {
      light.color.setHex(index % 2 ? theme.neonPrimary : theme.neonSecondary);
      light.intensity = theme.streetLightIntensity;
    });
    this.signMaterials.forEach((material, index) => material.color.setHex(index % 2 ? theme.signSecondary : theme.signPrimary));
  }
  private buildEnvironment(environment: LevelEnvironment): void {
    this.clearEnvironment();
    this.currentEnvironment = environment;
    if (environment === "station") this.buildStation();
    else if (environment === "rooftop") this.buildRooftop();
    else if (environment === "arena") this.buildArena();
    else this.buildStreet();
    const kit = this.models.get("environment.city-kit"); if (kit) this.placeKitProps(kit);
  }
  private clearEnvironment(): void {
    for (const material of this.signMaterials) material.dispose();
    this.streetLights.length = 0; this.signMaterials.length = 0;
    while (this.environmentRoot.children.length) this.environmentRoot.remove(this.environmentRoot.children[0]);
  }
  private buildStreet(): void {
    this.addGround(30, 145, -52);
    this.neonLight.position.set(-7, 6, -20); this.blueLight.position.set(7, 5, -52);
    for (let z = 0; z > -112; z -= 18) this.addStreetLight(z % 36 ? -5 : 5, 4.2, z, z % 36 ? 0x6fdfff : 0xff5a8d, 21);
    for (let z = 8; z > -120; z -= 9) for (const side of [-1, 1]) {
      const height = 8 + deterministic01(`street:${z}:${side}`) * 10;
      this.addBuilding(side * 10, height / 2, z, 8, height, 7);
      this.addSign(side * 5.95, 3.5, z, .15, 1.2, 2.5, z % 18 ? 0x35c8ff : 0xff2d72);
    }
  }
  private buildStation(): void {
    this.addGround(24, 145, -52);
    this.neonLight.position.set(-5.5, 4.2, -18); this.blueLight.position.set(5.5, 3.8, -54);
    for (let z = 8; z > -120; z -= 12) {
      this.addBuilding(-10.5, 3.2, z, 2.4, 6.4, 9.2);
      this.addBuilding(10.5, 3.2, z, 2.4, 6.4, 9.2);
      this.addBuilding(0, 6.7, z, 23.5, .45, 7.5);
      this.addSign(-6.9, 2.45, z + 1.5, .12, .8, 2.2, 0xf3cf5a);
      this.addSign(6.9, 2.45, z - 1.5, .12, .8, 2.2, 0x25f0d0);
    }
    for (const x of [-1.25, 1.25]) this.addBuilding(x, .08, -52, .18, .16, 138);
    for (let z = 0; z > -112; z -= 16) this.addStreetLight(z % 32 ? -4.4 : 4.4, 3.2, z, z % 32 ? 0x25f0d0 : 0xf3cf5a, 18);
  }
  private buildRooftop(): void {
    this.addGround(20, 145, -52);
    this.neonLight.position.set(-6.8, 4.8, -18); this.blueLight.position.set(6.8, 5.2, -50);
    for (const side of [-1, 1]) {
      this.addBuilding(side * 6.8, .55, -52, .7, 1.1, 142);
      for (let z = 5; z > -118; z -= 18) {
        this.addBuilding(side * 15, 3.6, z, 8.5, 7.2 + deterministic01(`roof:${z}:${side}`) * 4.5, 8);
        this.addSign(side * 7.4, 2.8, z - 3, .16, 1.1, 2.6, z % 36 ? 0xa45cff : 0xff8a2a);
      }
    }
    for (let z = -4; z > -112; z -= 24) {
      this.addAntenna(-3.5, z);
      this.addAntenna(3.8, z - 8);
      this.addStreetLight(z % 48 ? -4.9 : 4.9, 3.5, z, z % 48 ? 0xff8a2a : 0xa45cff, 17);
    }
  }
  private buildArena(): void {
    this.addGround(34, 118, -44);
    this.neonLight.position.set(-8, 5.8, -18); this.blueLight.position.set(8, 5.4, -42);
    for (const side of [-1, 1]) {
      this.addBuilding(side * 14, 2.1, -44, 3.5, 4.2, 112);
      for (let z = 2; z > -96; z -= 14) {
        this.addBuilding(side * 9.6, 1.05, z, .7, 2.1, 5.8);
        this.addSign(side * 8.75, 3.05, z - 2, .18, 1.8, 3.2, z % 28 ? 0xff2b22 : 0xffb000);
      }
    }
    this.addBuilding(0, .35, -101, 30, .7, 2.4);
    this.addBuilding(0, 4.4, -104, 15, 8.8, 3.2);
    for (const x of [-5.8, 5.8]) this.addBuilding(x, 3.4, -100, 1.2, 6.8, 1.2);
    for (const [x, z] of [[-5.5, -8], [5.5, -8], [-6.8, -32], [6.8, -32], [-5.2, -62], [5.2, -62]] as Array<[number, number]>) this.addStreetLight(x, 4.6, z, z % 24 ? 0xffb000 : 0xff2b22, 23);
  }
  private placeKitProps(kit: THREE.Group): void {
    const environment = this.currentEnvironment ?? "street";
    const positions: Array<[number, number, number]> = environment === "station"
      ? [[-6.8, -18, .58], [6.8, -44, .58], [-6.9, -76, .58]]
      : environment === "rooftop"
        ? [[-7.6, -20, .5], [7.6, -48, .5], [-7.8, -82, .5]]
        : environment === "arena"
          ? [[-10.2, -22, .64], [10.2, -40, .64], [-10.5, -68, .64], [10.5, -86, .64]]
          : [[-9, -13, .72], [9, -36, .72], [-9, -61, .72], [9, -84, .72]];
    for (const [x, z, scale] of positions) { const prop = kit.clone(true); prop.position.set(x, 0, z); prop.scale.setScalar(scale); if (x > 0) prop.rotation.y = Math.PI; this.environmentRoot.add(prop); }
  }
  private addGround(width: number, length: number, z: number): void {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(width, length), this.groundMaterial); ground.rotation.x = -Math.PI / 2; ground.position.z = z; ground.receiveShadow = true; this.environmentRoot.add(ground);
  }
  private addBuilding(x: number, y: number, z: number, width: number, height: number, depth: number): void {
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), this.buildingMaterial); building.position.set(x, y, z); building.castShadow = true; building.receiveShadow = true; this.environmentRoot.add(building);
  }
  private addSign(x: number, y: number, z: number, width: number, height: number, depth: number, color: number): void {
    const signMaterial = new THREE.MeshBasicMaterial({ color }); this.signMaterials.push(signMaterial);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), signMaterial); sign.position.set(x, y, z); this.environmentRoot.add(sign);
  }
  private addStreetLight(x: number, y: number, z: number, color: number, distance: number): void {
    const streetLight = new THREE.PointLight(color, 8, distance, 1.7); streetLight.position.set(x, y, z); this.streetLights.push(streetLight); this.environmentRoot.add(streetLight);
  }
  private addAntenna(x: number, z: number): void {
    this.addBuilding(x, 1.45, z, .18, 2.9, .18);
    this.addBuilding(x, 2.85, z, 1.7, .12, .12);
  }
  private resize(): void { this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix(); this.renderer.setSize(innerWidth, innerHeight); }
}
function deterministic01(key: string): number {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) { hash ^= key.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}
