# Handschrift-Generator (Text2Handwriting)

> Wandelt normalen Text in realistische Handschrift um. Hausaufgaben, Notizen und Briefe komplett lokal im Browser ohne Server-Upload.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · **Deutsch** · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Online ausprobieren](https://shouxie.newzone.top)

![UI-Vorschau: Links Text eingeben, rechts Handschrift generieren](../images/hero-en.png)

Ideal für handschriftliche Hausaufgaben, Lese- und Besprechungsnotizen oder persönliche Briefe. Anders als herkömmliche Tools, die Schriftarten nur starr austauschen, nutzt Text2Handwriting Pseudozufallssamen, um Schriftgröße, Drehung, Grundlinie und Tintenauftrag jedes Zeichens dynamisch zu variieren. Sogar menschliche Streichungen und Korrekturen werden täuschend echt simuliert – ganz ohne Account oder Serverübertragung.

## Kompatibilitätsübersicht

| Dimension | Details |
|---|---|
| Umgebung | Moderne Desktop- und Mobilbrowser, 100% clientseitig; auf schmalen Bildschirmen automatisch einspaltiger Editor-/Vorschau-Arbeitsbereich mit Umschaltung über die Segmenttasten oben (Chrome / Edge 103+ erkennen lokale Systemschriften; Safari / Firefox nutzen integrierte Erkennung) |
| Eingabeformate | Direkte Texteingabe, Upload von `.txt` / `.md` (strikte UTF-8-Prüfung mit GB18030-Fallback) und `.docx` (lokale Konvertierung) |
| Papierstile | 6 Papiermuster (liniert, Karopapier, Blanko A4, Englisch-Schreiblinien, Packpapier, Punktraster) sowie Foto-Uploads mit automatischer Skalierung |
| Stift und Haptik | 4 physikalische Stiftarten (Gelschreiber, Füllfederhalter, Bleistift, Kugelschreiber); diffuses Raumlicht, Falzlinien, Vignette und Vergilbung |
| Exportoptionen | Aktuelle Seite als PNG / JPG, alle Seiten als ZIP, mehrseitiges PDF, randloser Millimeter-Druck über verstecktes iframe (bis zu ~435 DPI) |
| Satz und Sprachen | 18 vollständig lokalisierte Sprachen; Worttrennungs-Schutz, CJK-Regeln, arabischer bidirektionaler Schriftsatz (BiDi RTL) mit nativer Ligatur |
| Offline und Speicher | PWA-App für Desktop und Mobilgeräte; Web-Locks-Schutz gegen parallele Tab-Konflikte, 250ms Auto-Save und Warnung vor dem Schließen |

## Funktionen

- **Realistische Handschrift**: Seed-gesteuerte Schwankungen bei Schriftgröße, Buchstabenabstand, Grundlinie, Tintenverlauf und Schreibermüdung. Jeder Durchlauf ist einzigartig und über den Seed exakt reproduzierbar.
- **Intelligenter Schriftsatz und BiDi-Text**: Zeilenumbruch-Regeln, Absatzeinzüge, automatische Paginierung und rechtsbündige Unterschriften. Volle Unterstützung für Arabisch mit nativer Buchstabenverbindung und Schutz von Klammern.
- **Papiertexturen und Fotorealismus**: Zeilenabstand und Ränder frei wählbar; quadratische Karos mit Spaltenautomatik; automatische Fotoanpassung; realistische Lichtverläufe, Knickfalten und Randabdunkelung.
- **Freie Schriftartenwahl**: 8 quelloffene Handschriften (4 offline im Paket + 4 aus Google Fonts geladen). Laden Sie Systemschriften, Google Fonts oder eigene `.ttf` / `.otf` / `.woff` / `.woff2`-Dateien (kompatibel mit Calligraphr für die eigene Handschrift).
- **Authentische Korrekturen**: 13 Durchstreich-Stile (einfach, doppelt, wellig, durchgestrichen) mit wählbarer Wahrscheinlichkeit; Tippfehler streichen und Korrektur darüber schreiben; die Zeichenwerkzeugleiste auf der Leinwand bietet Freihandpfeile, Skizzen und Einkreisungen sowie Radierer, Löschen der Handzeichnungen dieser Seite und Randhilfslinien.
- **Schreibstil-Profile**: Die 4 Profile Ordentliche Reinschrift, Spontane Notizen, Eiliger Entwurf und Klassische Hausarbeit passen Störungsintensität, Schreibtextur und Korrekturwahrscheinlichkeit mit einem Klick an.

## Auszeichnungs-Syntax

Mit Tags im Text können Durchstreichungen und Hervorhebungen gezielt gesteuert werden:

| Syntax | Visuelle Wirkung |
|---|---|
| `~~Fehler~~` oder `[del]Fehler[/del]` | Text durchstreichen |
| `[del:Korrektur]Fehler[/del]` | Text durchstreichen und Korrektur über die Zeile schreiben |
| `[u]Wichtig[/u]` | Wellige Unterstreichung |
| `[circle]Wichtig[/circle]` | Text einkreisen (Alias `[圈]…[/圈]`) |
| `[box]Wichtig[/box]` | Text einrahmen (Alias `[框]…[/框]`) |
| `[right]Unterschrift[/right]` | Gesamte Zeile rechtsbündig (Alias `[靠右]…[/靠右]`) für Unterschriften und Daten |

## Schnellstart

1. Öffnen Sie die [Online-Demo](https://shouxie.newzone.top) oder laden Sie eine Textdatei (`.txt` / `.docx` / `.md`) hoch.
2. Wählen Sie links Papiermuster, Handschrift und Schreibstil aus und passen Sie Unregelmäßigkeit oder Fotolicht nach Wunsch an (auf dem Smartphone wechseln Sie oben über die Segmenttasten „Bearbeiten / Vorschau“ zwischen den beiden Spalten).
3. Klicken Sie oben auf „Exportieren“, um hochauflösende Bilder (PNG / JPG), ein ZIP aller Seiten, ein mehrseitiges PDF herunterzuladen oder in echter Millimetergröße zu drucken.

## Bekannte Einschränkungen

- Der lateinische und CJK-Schriftsatz verwendet geschätzte Zeichenbreiten für sofortige Reaktionszeiten bei langen Texten (nur Arabisch nutzt Canvas-Echtzeitmessung). Bei sehr ungewöhnlichen Schriftarten können Zeilenenden minimal abweichen.
- Die Druckfunktion des Browsers druckt nur die aktuelle Seite; nutzen Sie den PDF-Export, um das gesamte Dokument mehrseitig zu drucken.
- Safari unter Version 16 unterstützt kein `ctx.filter`, wodurch Helligkeits- und Kontrasteinstellungen des Hintergrundbilds dort wirkungslos sind.
- Die Zeichnungsebene ist im Speicher an die jeweilige Seitenzahl gebunden; größere Textänderungen, die den Seitenumbruch verändern, können Zeichnungen verschieben.
- Von den mitgelieferten Schriftarten sind 4 offline im Paket enthalten; die übrigen 4 (Liu Jian Mao Cao, ZCOOL XiaoWei, Caveat, Kalam) werden zur Laufzeit von Google Fonts geladen und fallen bei fehlender Internetverbindung auf Systemschriften zurück.
- Lokal importierte `.ttf` / `.otf` / `.woff` / `.woff2`-Schriften verbleiben nur im Arbeitsspeicher des aktiven Tabs und müssen nach dem Neuladen neu ausgewählt werden.

## Lokale Entwicklung

Erfordert Node.js **22.12+ / 24+ / 26+**:

```bash
npm install
npm run dev        # Entwicklungsserver starten unter http://localhost:5173/
npm test           # Komponententests mit Vitest ausführen
npm run lint       # Code-Prüfung mit oxlint
npm run build      # Produktions-Build erstellen (tsc + vite)
```

Die Build-Dateien in `dist/` nutzen relative Pfade (`base: './'`) und können direkt auf GitHub Pages oder eigenen Servern bereitgestellt werden. Architektur- und Lokalisierungsdetails finden sich in der [Entwicklungsdokumentation (docs/development.md)](../development.md).

## Lizenz

- **Code**: MIT-Lizenz, siehe [LICENSE](../../LICENSE)
- **Schriftarten**: Die Schriftarten in `public/fonts/` unterliegen der SIL Open Font License (OFL), siehe [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Dieses Projekt ist eine unabhängige Entwicklung und steht in keiner Verbindung zu ähnlichen Drittanbieter-Tools.

## Über den 365 Open Source Plan

Projekt **#039** des [365 Open Source Plan](https://github.com/rockbenben/365opensource) — eine Person + KI, über 300 Open-Source-Projekte in einem Jahr.

[Reiche deine Idee ein →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
