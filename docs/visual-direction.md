# Typo City Visual Direction

## Mood

Retro-horror arcade city at night. The look should feel deliberately low-poly and slightly uneasy, with clean silhouettes that remain readable behind word labels.

## Palette

- Asphalt and facades: blue-black, charcoal, desaturated steel.
- Gameplay lights: cyan signage for depth and pink neon for danger.
- Enemies: walker green-grey, runner magenta, brute ochre, boss violet.
- Eyes and hit feedback: saturated red.

## Character Rules

- `walker`: upright, loose arms, readable basic threat.
- `runner`: narrow silhouette, forward lean, longer limbs.
- `brute`: wide shoulders, large hands, slower visual rhythm.
- `boss`: tall ritual silhouette, four arms, crown spikes, three eyes.

## Environment Kit

The first modular kit contains a streetlamp, a neon bus shelter, debris and road-side building masses. New props should preserve a simple material budget and avoid visual noise around word labels.

## Shipping Rules

- Runtime assets ship as GLB under stable manifest keys.
- Third-party assets with attribution requirements are listed in `docs/asset-attribution.md`.
- Procedural PNG textures ship in `public/assets/textures` and are regenerated with `npm run assets`.
- Keep the pixel-texture language deliberate: `32x32` for characters and props, `64x64` for large environment surfaces, nearest-neighbor filtering at runtime.
- Preserve stable material names (`skin`, `cloth`, `runner_skin`, `brute_skin`, `boss_skin`, `steel`, `stone`) when replacing generated GLB files with authored exports.
- Ground-level pivots, forward-facing models, meter-like units.
- Prefer shared materials and low segment counts.
- Use procedural animation for this pass; authored animation clips can replace it later.
