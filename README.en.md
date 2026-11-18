# Text2Handwriting

> Turn plain text into realistic handwriting pages, fully offline in your browser.

[简体中文](README.md) · **English** · [繁體中文](docs/i18n/README.zh-Hant.md) · [日本語](docs/i18n/README.ja.md) · [한국어](docs/i18n/README.ko.md) · [Español](docs/i18n/README.es.md) · [Français](docs/i18n/README.fr.md) · [Deutsch](docs/i18n/README.de.md) · [Português](docs/i18n/README.pt.md) · [Русский](docs/i18n/README.ru.md) · [Italiano](docs/i18n/README.it.md) · [العربية](docs/i18n/README.ar.md) · [हिन्दी](docs/i18n/README.hi.md) · [বাংলা](docs/i18n/README.bn.md) · [ไทย](docs/i18n/README.th.md) · [Türkçe](docs/i18n/README.tr.md) · [Tiếng Việt](docs/i18n/README.vi.md) · [Bahasa Indonesia](docs/i18n/README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Try it online](https://shouxie.newzone.top)

![UI Preview: paste text on the left, generate handwriting on the right](docs/images/hero-en.png)

Designed for handwriting homework, reading journals, meeting transcripts, and formal letters. Unlike generic handwriting tools that only swap font faces mechanically, Text2Handwriting applies seed-controlled pseudo-random perturbation to glyph size, rotation, baseline jitter, and ink density. It runs entirely within your browser with zero server uploads or account requirements.

## Support Matrix

| Dimension | Details |
|---|---|
| Environment | Modern desktop and mobile browsers, 100% client-side (Chrome / Edge 103+ can enumerate all local fonts, Safari / Firefox use built-in detection) |
| Import formats | Paste text directly, or upload `.txt` / `.md` (strict UTF-8 validation with GB18030 fallback), `.docx` (client-side extraction) |
| Paper styles | 6 paper presets (ruled notebook, composition grid, blank A4, English four-line, kraft paper, dot grid), plus custom paper photo uploads with auto-fitting |
| Pen & realism | 4 physical pen physics (gel, fountain, pencil, ballpoint); ambient lighting diffuse, fold crease shadows, corner vignettes, and vintage ageing |
| Export options | Current page PNG / JPG, all pages ZIP archive, multi-page PDF, hidden iframe real-millimeter lossless printing (up to ~435 DPI) |
| Typesetting | 18 fully translated UI languages (Simplified Chinese, Traditional Chinese, English, Japanese, Korean, German, Spanish, French, Italian, Portuguese, Russian, Arabic, Hindi, Bengali, Indonesian, Thai, Vietnamese, Turkish); CJK punctuation avoidance rules, English word-wrap protection, Arabic bidirectional layout (BiDi RTL) with native cursive joining |
| Offline & sync | PWA offline shell installable on desktop and mobile; Web Locks cross-tab concurrency protection, 250ms debounced persistence, and unsaved changes alert |

## What It Does

- **Realistic handwriting**: Seed-controlled pseudo-random perturbation across glyph size, letter spacing, baseline drift, stroke width, ink bleed, and writing fatigue. Every render is unique, and saving the seed lets you 100% reproduce identical output.
- **Smart typesetting & bidirectional text**: 18 languages fully localized out of the box; strict CJK line-start / line-end rules, first-line indent, pagination, and right-aligned signatures; word break prevention for Latin scripts; native cursive joining and paired punctuation protection for Arabic and RTL scripts.
- **Paper & photo textures**: Customizable line spacing and margins, square grid columns linkage; auto-fit photo uploads into page borders; realistic ambient lighting gradients, center creases, corner vignettes, and aged yellowing.
- **Any font**: 4 bundled open-source handwriting fonts (100% offline ready); load system fonts, Google Fonts, or drop in `.ttf` / `.otf` files (compatible with Calligraphr to use your own handwriting).
- **Realistic corrections**: 13 strikethrough styles (single-line, double-line, wavy, scribbled blocks) triggered by configurable probability; strike out wrong characters and write corrections above the line; built-in drawing layer for arrows, sketches, and annotations.
- **Writing personas**: 4 one-click presets (neat student, casual notes, rushed scrawl, formal copy) that instantly configure pen type, perturbation intensity, and line spacing.

## Markup Syntax

Use inline markup tags directly in your text to specify exact strikethroughs and highlights (markup takes precedence over random probability):

| Syntax | Rendered Effect |
|---|---|
| `~~wrong~~` or `[del]wrong[/del]` | Strike through text |
| `[del:correction]typo[/del]` | Strike through and write the correction above the line |
| `[u]highlight[/u]` | Wavy underline |
| `[circle]highlight[/circle]` | Circle around text (alias `[圈]…[/圈]`) |
| `[box]highlight[/box]` | Box around text (alias `[框]…[/框]`) |

## Quick Start

1. Open the [online demo](https://shouxie.newzone.top) or import a text file (`.txt` / `.docx` / `.md`).
2. Pick a paper style, handwriting font, and writing persona from the left panel, and adjust perturbation or photo lighting.
3. Click "Export" in the top header to download high-resolution images, multi-page PDF, or send directly to the printer.

## Limitations

- CJK and Latin typesetting use estimated glyph widths for sub-second pagination performance on 100+ page documents (Arabic bidirectional typesetting uses native Canvas font measurement); with handwritten fonts whose glyph metrics deviate significantly from standard ratios, line endings may slightly overshoot or undershoot.
- Browser printing prints the current page only; use PDF export to print the entire multi-page document.
- Safari below version 16 lacks `ctx.filter` support, meaning paper brightness and contrast adjustments have no effect there.
- The drawing layer is bound to page indices in memory; major text edits that re-paginate the document may cause strokes to shift across pages.
- Locally imported `.ttf` / `.otf` font files are kept only in the current session's memory and must be re-selected after a page refresh.

## Local Development

Requires Node.js **22.12+ / 24+ / 26+** (CI builds on Node 26):

```bash
npm install
npm run dev        # start local development server at http://localhost:5173/
npm test           # run Vitest unit test suite
npm run lint       # static code analysis (oxlint)
npm run build      # production build (tsc + vite)
```

The build output in `dist/` uses relative paths (`base: './'`) and can be hosted on GitHub Pages or any intranet web server. See [docs/development.md](docs/development.md) for chunk-splitting details, engine architecture, and adding new languages.

## License

- **Code**: MIT License, see [LICENSE](LICENSE)
- **Fonts**: Bundled fonts under `public/fonts/` are licensed under the SIL Open Font License (OFL), see [LICENSE-FONTS.md](LICENSE-FONTS.md)

This project is an independent implementation and has no affiliation with third-party handwriting tools.

## About the 365 Open Source Plan

Project **#039** of the [365 Open Source Plan](https://github.com/rockbenben/365opensource) — one person + AI, 300+ open-source projects in a year.

[Submit your idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
