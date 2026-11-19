# Generatore di Scrittura a Mano (Text2Handwriting)

> Trasforma testo semplice in pagine scritte a mano realistiche, interamente nel browser senza caricamenti su server.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · **Italiano** · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Prova online](https://shouxie.newzone.top)

![Anteprima dell'interfaccia: testo a sinistra, foglio scritto a mano a destra](../images/hero-en.png)

Ideato per compiti scritti a mano, appunti di lettura, verbali di riunioni e lettere formali. A differenza dei normali strumenti che si limitano a cambiare font meccanicamente, Text2Handwriting applica perturbazioni pseudo-casuali guidate da seed a dimensione, rotazione, allineamento e densità dell'inchiostro, simulando persino errori e correzioni naturali. Viene eseguito interamente nel browser locale, senza account né invio di dati a server esterni.

## Matrice di compatibilità

| Dimensione | Dettagli |
|---|---|
| Ambiente | Browser moderni per desktop e dispositivi mobili, 100% lato client; sugli schermi stretti passa automaticamente a un'area di lavoro a colonna singola per editor e anteprima, con cambio tramite i pulsanti segmentati in alto (Chrome ed Edge 103+ possono elencare i font locali, Safari e Firefox usano il rilevamento integrato) |
| Formati di importazione | Incolla testo direttamente, carica file `.txt` / `.md` (convalida UTF-8 con fallback a GB18030) o file `.docx` (estrazione lato client) |
| Stili di carta | 6 tipi di carta predefiniti (a righe, a quadretti, foglio A4 bianco, 4 righe per calligrafia inglese, carta kraft, puntinata) e caricamento foto di carta con adattamento automatico |
| Penne ed effetti | 4 fisiche di penna (gel, stilografica, matita, a sfera); luce diffusa, ombre di piega, vignettatura e invecchiamento carta |
| Opzioni di esportazione | Pagina corrente in PNG / JPG, tutte le pagine in archivio ZIP, PDF multipagina, stampa senza perdita a millimetri reali via iframe nascosto (fino a ~435 DPI) |
| Tipografia | Interfaccia localizzata in 18 lingue; a capo intelligente, regole di punteggiatura CJK, composizione bidirezionale in arabo (BiDi RTL) con legature corsive fluide |
| Offline e sincronizzazione | PWA installabile su desktop e mobile; protezione da conflitti tramite Web Locks tra schede, salvataggio continuo a 250 ms e avviso per modifiche non salvate |

## Funzionalità

- **Scrittura a mano realistica**: Fluttuazioni pseudo-casuali controllate da seed per dimensione, spaziatura, inclinazione, linea di base e fatica di scrittura. Ogni rendering è unico e il seed consente di riprodurre al 100% lo stesso risultato.
- **Tipografia intelligente e bidirezionale**: Regole di inizio e fine riga CJK, rientro del paragrafo, impaginazione automatica e allineamento firme a destra. Supporto nativo per caratteri arabi con legature continue e protezione delle parentesi.
- **Trame di carta e foto**: Regolazione millimetrica di interlinea e margini; quadretti geometrici perfetti; adattamento automatico delle foto caricate ai bordi A4; ombre di piegatura e illuminazione naturale.
- **Qualsiasi font**: 8 font calligrafici open source (4 inclusi offline + 4 caricati da Google Fonts). Carica font di sistema, Google Fonts o file `.ttf` / `.otf` / `.woff` / `.woff2` (compatibile con Calligraphr per usare la propria calligrafia).
- **Correzioni ed errori naturali**: 13 stili di cancellatura (riga singola, doppia, ondulata, scarabocchio) attivati con probabilità configurabile; barratura degli errori e inserimento della correzione sopra la riga; la barra degli strumenti della tela consente di tracciare a mano libera frecce, schizzi e cerchi, con gomma, cancellazione dei tratti della pagina corrente e guide dei margini.
- **Stili di scrittura predefiniti**: 4 profili (Studente modello, Appunti spontanei, Scrittura frettolosa, Compito scolastico formale) che applicano in un clic intensità della perturbazione, texture di scrittura e probabilità di correzione.

## Sintassi di formattazione

Usa tag di formattazione direttamente nel testo per definire cancellature e punti salienti precisi:

| Sintassi | Effetto visivo |
|---|---|
| `~~errore~~` o `[del]errore[/del]` | Barra il testo |
| `[del:correzione]errore[/del]` | Barra l'errore e scrive la correzione sopra la riga |
| `[u]evidenzia[/u]` | Sottolineatura ondulata |
| `[circle]evidenzia[/circle]` | Cerchio attorno al testo (alias `[圈]…[/圈]`) |
| `[box]evidenzia[/box]` | Riquadro attorno al testo (alias `[框]…[/框]`) |
| `[right]firma[/right]` | Allinea l'intera riga a destra (alias `[靠右]…[/靠右]`) per firme e date |

## Guida rapida

1. Apri la [demo online](https://shouxie.newzone.top) o carica un file di testo (`.txt` / `.docx` / `.md`).
2. Scegli lo stile di carta, il font e il profilo di scrittura dal pannello sinistro, regolando se necessario perturbazione e illuminazione (su smartphone usa i pulsanti segmentati "Modifica / Anteprima" in alto per passare da una colonna all'altra).
3. Clicca su "Esporta" nella barra superiore per scaricare immagini ad alta risoluzione (PNG / JPG), un archivio ZIP di tutte le pagine, un PDF multipagina o stampare direttamente in millimetri reali.

## Limitazioni

- L'impaginazione per testo latino e CJK utilizza la stima della larghezza dei glifi per garantire una velocità di elaborazione istantanea su documenti lunghi (il testo arabo usa la misurazione nativa Canvas); con font calligrafici atipici le estremità delle righe possono subire lievi variazioni.
- La stampa dal browser stampa unicamente la pagina corrente; usa l'esportazione PDF per stampare l'intero documento multipagina.
- In Safari versione precedente alla 16, la mancanza di `ctx.filter` disattiva le regolazioni di luminosità e contrasto dello sfondo.
- Il livello di disegno a mano libera è collegato agli indici delle pagine in memoria; modifiche consistenti al testo che alterano la paginazione possono spostare i tratti tra le pagine.
- Dei font integrati, 4 sono inclusi per l'uso offline; gli altri 4 (Liu Jian Mao Cao, ZCOOL XiaoWei, Caveat, Kalam) vengono caricati da Google Fonts a runtime e, offline o in reti interne, ripiegano sui font di sistema.
- I file di font `.ttf` / `.otf` / `.woff` / `.woff2` importati localmente risiedono solo nella memoria della sessione del browser e devono essere riselezionati dopo aver ricaricato la pagina.

## Sviluppo locale

Richiede Node.js **22.12+ / 24+ / 26+**:

```bash
npm install
npm run dev        # avvia il server di sviluppo locale su http://localhost:5173/
npm test           # esegue i test unitari con Vitest
npm run lint       # analisi statica del codice (oxlint)
npm run build      # compilazione per la produzione (tsc + vite)
```

I file generati nella cartella `dist/` utilizzano percorsi relativi (`base: './'`) e possono essere ospitati su GitHub Pages o su qualsiasi server web. Consulta [docs/development.md](../development.md) per i dettagli sull'architettura e l'aggiunta di nuove lingue.

## Licenza

- **Codice sorgente**: Licenza MIT, consulta [LICENSE](../../LICENSE)
- **Font**: I font inclusi nella cartella `public/fonts/` sono distribuiti con licenza SIL Open Font License (OFL), consulta [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Questo progetto è un'implementazione autonoma e indipendente da altri strumenti di scrittura a mano.

## Informazioni sul Piano 365 Open Source

Progetto **#039** del [Piano 365 Open Source](https://github.com/rockbenben/365opensource) — una persona + IA, oltre 300 progetti open source in un anno.

[Proponi la tua idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
