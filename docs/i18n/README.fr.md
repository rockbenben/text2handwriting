# Générateur d'Écriture Manuscrite (Text2Handwriting)

> Mettez en page du texte brut sous forme de manuscrits réalistes. Devoirs, fiches et lettres entièrement en local sans téléversement.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · **Français** · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Essayer en ligne](https://shouxie.newzone.top)

![Aperçu de l'interface : texte à gauche, manuscrit généré à droite](../images/hero-en.png)

Idéal pour les devoirs manuscrits, les fiches de lecture, les comptes-rendus et les lettres personnelles. Contrairement aux générateurs basiques qui appliquent une police de façon uniforme, Text2Handwriting utilise des graines pseudo-aléatoires pour faire varier la taille, l'angle, la ligne de base et l'encrage de chaque caractère, tout en reproduisant fidèlement les ratures humaines. Tout s'exécute dans votre navigateur sans inscription ni serveur distant.

## Tableau de compatibilité

| Dimension | Détails |
|---|---|
| Environnement | Navigateurs de bureau et mobiles modernes, 100% exécuté côté client ; sur les écrans étroits, l'interface passe automatiquement en espace de travail à une colonne édition/aperçu, avec bascule par les boutons segmentés en haut (Chrome / Edge 103+ peuvent lister les polices locales, Safari / Firefox utilisent la détection intégrée) |
| Formats d'entrée | Saisie directe, import de fichiers `.txt` / `.md` (validation stricte UTF-8 avec repli GB18030) et `.docx` (extraction locale) |
| Styles de papier | 6 modèles (cahier à lignes, quadrillage, feuille A4 blanche, 4 lignes d'anglais, papier kraft, carnet à points) et photos de papier personnalisées |
| Stylo et réalisme | 4 styles de stylos physiques (gel, plume, crayon à papier, bille) ; lumière diffuse, plis de papier, ombres d'angles et effet vieilli |
| Exportation | Page actuelle en PNG / JPG, archive ZIP de toutes les pages, PDF multipage, impression fidèle aux dimensions réelles en millimètres (jusqu'à ~435 DPI) |
| Typographie | 18 langues avec interface complète ; césure intelligente, ponctuation CJK, mise en page bidirectionnelle en arabe (BiDi RTL) avec ligatures fluides |
| Mode hors-ligne | PWA installable sur ordinateur et mobile ; gestion des conflits multi-onglets via Web Locks, sauvegarde automatique à 250ms et alerte avant fermeture |

## Fonctionnalités

- **Réalisme d'écriture** : Perturbations pseudo-aléatoires contrôlées par graine sur la taille des glyphes, la rotation, l'alignement, l'irrégularité des lignes et la fatigue d'écriture. Chaque rendu est unique et réutilisable à l'identique grâce à la graine.
- **Composition avancée et bidirectionnelle** : Ponctuation de début et fin de ligne, retrait de paragraphe, pagination automatique et alignement des signatures à droite. Prise en charge native de l'arabe avec liaisons cursives fluides et préservation des parenthèses.
- **Textures de papier et rendu photo** : Ajustement personnalisé de l'interligne et des marges ; quadrillage à carreaux carrés proportionnels ; redimensionnement automatique des photos ; ombrages d'éclairage ambiant, plis centraux et vignetage.
- **Polices personnalisées** : 8 polices manuscrites libres (4 incluses hors-ligne + 4 chargées depuis Google Fonts). Chargez vos polices système, polices Google ou importez des fichiers `.ttf` / `.otf` / `.woff` / `.woff2` (compatible avec Calligraphr pour utiliser votre propre écriture).
- **Ratures et annotations naturelles** : 13 styles de ratures (trait simple, double, vague, hachures) avec probabilité configurable ; biffage et réécriture au-dessus de la ligne ; la barre d'outils du canevas permet de dessiner à main levée des flèches, des croquis et des cercles, avec gomme, effacement des tracés de la page et repères de marge.
- **Personnalités d'écriture** : 4 profils (Élève appliqué, Prise de notes spontanée, Écriture précipitée, Devoir réglementaire) qui appliquent en un clic l'intensité des perturbations, la texture d'écriture et la probabilité de rature.

## Syntaxe de balisage

Ajoutez des balises directement dans votre texte pour forcer des ratures ou des mises en valeur précises :

| Syntaxe | Effet visuel |
|---|---|
| `~~erreur~~` ou `[del]erreur[/del]` | Biffer le texte |
| `[del:correction]erreur[/del]` | Raturer et écrire le mot corrigé au-dessus de la ligne |
| `[u]important[/u]` | Soulignement ondulé |
| `[circle]important[/circle]` | Entourer d'un cercle (alias `[圈]…[/圈]`) |
| `[box]important[/box]` | Encadrer d'un rectangle (alias `[框]…[/框]`) |
| `[right]signature[/right]` | Aligner toute la ligne à droite (alias `[靠右]…[/靠右]`) pour les signatures et les dates |

## Démarrage rapide

1. Ouvrez la [démo en ligne](https://shouxie.newzone.top) ou chargez un fichier texte (`.txt` / `.docx` / `.md`).
2. Choisissez le type de papier, la police et le style d'écriture dans le panneau latéral gauche, puis ajustez les perturbations ou l'éclairage photo (sur mobile, utilisez les boutons segmentés « Modifier / Aperçu » en haut pour basculer entre les deux colonnes).
3. Cliquez sur « Exporter » dans la barre supérieure pour télécharger des images haute résolution (PNG / JPG), un ZIP de toutes les pages, un PDF multipage, ou imprimer directement en dimensions réelles millimétrées.

## Limites connues

- La composition utilise une estimation de la largeur des glyphes pour garantir une vitesse d'affichage instantanée (seul l'arabe utilise la mesure native Canvas). Pour des polices très inhabituelles, les fins de ligne peuvent légèrement varier.
- L'impression via le navigateur n'imprime que la page en cours ; utilisez l'export PDF pour imprimer l'intégralité du document.
- Sur Safari inférieur à la version 16, l'absence de `ctx.filter` désactive le réglage de luminosité et de contraste du fond de page.
- Le calque de dessin manuel est rattaché au numéro de page en mémoire ; d'importantes modifications du texte modifiant la pagination peuvent décaler les annotations.
- Parmi les polices intégrées, 4 sont fournies hors-ligne ; les 4 autres (Liu Jian Mao Cao, ZCOOL XiaoWei, Caveat, Kalam) sont chargées depuis Google Fonts à l'exécution et retombent sur les polices système hors connexion ou sur un réseau interne.
- Les fichiers de polices `.ttf` / `.otf` / `.woff` / `.woff2` importés localement restent uniquement dans la mémoire de l'onglet actif et doivent être rechargés après actualisation.

## Développement local

Nécessite Node.js **22.12+ / 24+ / 26+** :

```bash
npm install
npm run dev        # serveur de développement sur http://localhost:5173/
npm test           # exécuter les tests unitaires avec Vitest
npm run lint       # vérification du code avec oxlint
npm run build      # compilation de production (tsc + vite)
```

Les fichiers générés dans `dist/` utilisent des chemins relatifs (`base: './'`) et peuvent être hébergés directement sur GitHub Pages ou tout serveur statique. Consultez [docs/development.md](../development.md) pour découvrir l'architecture et la méthode d'ajout de langues.

## Licence

- **Code** : Licence MIT, voir [LICENSE](../../LICENSE)
- **Polices** : Les polices du dossier `public/fonts/` sont sous licence SIL Open Font License (OFL), voir [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Ce projet est une création indépendante et n'a aucun lien avec des outils tiers similaires.

## À propos du 365 Open Source Plan

Projet **#039** du [365 Open Source Plan](https://github.com/rockbenben/365opensource) — une personne + l'IA, plus de 300 projets open source en un an.

[Proposez votre idée →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
