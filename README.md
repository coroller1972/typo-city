# Typo City

Typo City est un jeu web arcade 3D de dactylographie, inspire par la boucle de gameplay de *The Typing of the Dead* sans reprendre ses personnages, decors ou assets. Le joueur traverse une ville retro-horreur low-poly en camera sur rails, verrouille les ennemis avec la premiere lettre de leur mot, puis les elimine en tapant rapidement des mots francais.

jouer sur : https://typo-city.vercel.app

## Etat Du Projet

Le projet contient actuellement une run arcade jouable avec plusieurs niveaux enchaines :

- **Rue des Brumes** : introduction et apprentissage.
- **Station Souterraine** : pression accrue avec runners et couloirs serres.
- **Toits Orageux** : distances plus courtes, decor ouvert et ambiance violette.
- **Armaggedon** : niveau final avec arene, deux brutes puis double boss.

Le jeu inclut score local, combo, bonus de fin de niveau, intermissions narratives, musiques par niveau, debug/playtest panel et assets GLB low-poly animes.

## Stack

- Vite
- TypeScript
- Three.js
- Vitest
- HUD et menus en DOM
- Simulation separee du renderer Three.js

## Installation

```bash
npm install
```

## Commandes

```bash
npm run dev
npm test
npm run build
npm run assets
```

- `npm run dev` lance le serveur Vite.
- `npm test` lance les tests unitaires de simulation.
- `npm run build` compile TypeScript et produit le build Vite.
- `npm run assets` regenere les assets derives du pipeline local.

## Controles

- Taper les lettres des mots affiches au-dessus des ennemis.
- La premiere lettre verrouille une cible.
- Les accents affiches sont tolerants a la saisie : `e` peut valider `é`.
- `Echap` met en pause.
- `Entree` continue depuis une intermission.
- `F2` coupe ou reactive la musique.
- `F3` change le volume de musique.
- `F10` affiche ou cache le panel debug.

## Debug Playtest

Quand le debug est actif avec `F10` :

- `F5` genere une nouvelle seed.
- `F6` saute a la vague suivante.
- `F7` va a la vague boss.
- `F8` change la vitesse de simulation.
- `F9` nettoie les ennemis actifs.

Le panel affiche le niveau, le theme, l'environnement, la musique, la seed, le score, la precision, les ennemis actifs et les metriques par vague.

## Structure

```text
src/
  data/
    levelBlueprints.ts  # niveaux, vagues, themes, environnements
    music.ts            # musiques par niveau
    wordPools.ts        # dictionnaire francais par difficulte
  simulation/
    game.ts             # etat de jeu, saisie, score, vies, progression
    level.ts            # generation et validation des vagues
    words.ts            # normalisation des accents
    game.test.ts        # tests unitaires
  render/
    world.ts            # scene Three.js, camera, decors, ennemis, labels
    audio.ts            # musique et SFX
    assets.ts           # manifest assets/textures/audio
  main.ts               # boucle app, HUD, menus, debug
  style.css             # UI DOM et feedback arcade
public/assets/
  audio/                # musiques
  characters/           # GLB ennemis derives
  environment/          # kit decor
  textures/             # textures low-poly
  vendor/               # pack GLB source integre
docs/
  asset-attribution.md
  visual-direction.md
scripts/
  generate-assets.mjs
```

## Modifier Les Niveaux

Les niveaux sont configures dans `src/data/levelBlueprints.ts`.

Chaque niveau definit :

- `title` et `subtitle` pour le menu.
- `briefing` et `threat` pour les intermissions narratives.
- `music` pour la piste audio.
- `environment` pour le preset de decor (`street`, `station`, `rooftop`, `arena`).
- `theme` pour les couleurs, le brouillard, les lumieres et l'exposition.
- `waves` pour les ennemis, distances, lanes, pools de mots et offsets de labels.

Les musiques sont mappees dans `src/data/music.ts`. Les fichiers audio doivent etre places dans `public/assets/audio`.

## Assets

Les assets du jeu sont stockes dans `public/assets` afin d'etre servis directement par Vite. Les fichiers `.glb`, `.png` et `.mp3` de ce dossier sont volontairement versionnables.

Le projet contient aussi un fichier GLB source a la racine (`super_low-poly_stylized_zombies_animated.glb`) utilise pendant l'integration initiale. Les assets servis par le jeu se trouvent dans `public/assets`.

## Tests Et Qualite

Les tests couvrent notamment :

- normalisation des accents ;
- verrouillage de cible ;
- erreurs et combo ;
- degats ;
- score et bonus ;
- persistance du meilleur score ;
- generation valide des niveaux ;
- selection des niveaux et environnement final.

Commande :

```bash
npm test
```

## Notes De Versionnement

Le dossier `dist/` et `node_modules/` ne doivent pas etre versionnes. Les assets dans `public/assets/` doivent rester versionnes pour que le jeu fonctionne apres clone du depot.
