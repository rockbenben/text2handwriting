# Generador de Manuscritos (Text2Handwriting)

> Convierte texto plano en páginas manuscritas realistas. Tareas, notas y cartas completamente en local sin subir archivos.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Español** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Probar en línea](https://shouxie.newzone.top)

![Vista previa de interfaz: texto a la izquierda, manuscrito a la derecha](../images/hero-en.png)

Diseñado para tareas escolares escritas a mano, diarios de lectura, actas de reuniones y cartas personales. A diferencia de las herramientas que solo cambian la tipografía de forma mecánica, Text2Handwriting utiliza semillas pseudoaleatorias para perturbar el tamaño, la rotación, el espaciado y la línea base de cada letra, simulando la densidad de tinta y las correcciones humanas reales. Funciona íntegramente en tu navegador sin registro ni servidores externos.

## Matriz de compatibilidad

| Dimensión | Detalles |
|---|---|
| Entorno | Navegadores modernos de escritorio y móvil, 100% en local del cliente; en pantallas estrechas pasa automáticamente a un espacio de trabajo de una columna para edición y vista previa, con botones segmentados arriba (Chrome y Edge 103+ pueden enumerar fuentes locales; Safari y Firefox usan detección integrada) |
| Formatos de entrada | Pegar texto directamente o subir archivos `.txt` / `.md` (validación estricta UTF-8 y respaldo GB18030), `.docx` (extracción local) |
| Tipos de papel | 6 estilos de papel (rayado, cuadrícula, A4 en blanco, pauta de 4 líneas en inglés, papel kraft, punteado), además de fotos de papel personalizadas con ajuste automático |
| Bolígrafo y realismo | 4 físicas de bolígrafo (gel, estilográfica, lápiz, bolígrafo tradicional); iluminación ambiental difusa, marcas de pliegue, viñetas y envejecimiento vintage |
| Exportación | Página actual en PNG / JPG, todas las páginas en ZIP, PDF multipágina, impresión directa a milímetros reales mediante iframe oculto (hasta ~435 DPI) |
| Tipografía e idiomas | 18 idiomas con interfaz completa; reglas de puntuación CJK, protección contra corte de palabras y composición bidireccional en árabe (BiDi RTL) con ligaduras fluidas |
| Almacenamiento offline | PWA instalable en escritorio y móvil; protección de concurrencia entre pestañas con Web Locks, autoguardado a 250ms y aviso de cierre |

## Qué puede hacer

- **Realismo manuscrito**: Perturbación pseudoaleatoria controlada por semilla en tamaño, inclinación, línea base, densidad de tinta y fatiga al escribir. Cada renderizado es único y guardar la semilla permite reproducir exactamente el mismo resultado.
- **Tipografía inteligente y bidireccional**: Puntuación de inicio y fin de línea, sangría de párrafo, paginación automática y firma alineada a la derecha. Soporte nativo para árabe y lenguas RTL con unión cursiva fluida y protección de paréntesis.
- **Texturas de papel y fotografía**: Ajuste libre de interlineado y márgenes; cuadrícula con celdas cuadradas proporcionales; escalado automático de fotos de papel a bordes A4; gradientes de luz natural, sombras de doblez central y viñeteado.
- **Cualquier fuente**: 8 fuentes caligráficas de código abierto (4 incluidas offline + 4 cargadas desde Google Fonts). Carga fuentes del sistema, fuentes de Google o importa archivos `.ttf` / `.otf` / `.woff` / `.woff2` (compatible con Calligraphr para usar tu propia letra).
- **Tachones y anotaciones realistas**: 13 estilos de tachado (línea simple, doble, ondulada, garabatos) activados por probabilidad; tacha errores y escribe la corrección encima; la barra de herramientas del lienzo permite dibujar flechas, bocetos y círculos a mano, con goma de borrar, borrado de los trazos de la página actual y guías de margen.
- **Estilos de escritura predefinidos**: 4 personalidades (Estudiante impecable, Apuntes espontáneos, Escritura apresurada, Tarea escolar reglamentaria) que aplican en un clic la intensidad de la perturbación, la textura de escritura y la probabilidad de corrección.

## Sintaxis de marcado

Puedes usar etiquetas en el texto para forzar tachones y resaltados en posiciones exactas:

| Sintaxis | Efecto visual |
|---|---|
| `~~error~~` o `[del]error[/del]` | Tachar texto |
| `[del:corrección]error[/del]` | Tachar y escribir la corrección encima de la línea |
| `[u]destacado[/u]` | Subrayado ondulado |
| `[circle]destacado[/circle]` | Rodear con un círculo (alias `[圈]…[/圈]`) |
| `[box]destacado[/box]` | Enmarcar en una caja (alias `[框]…[/框]`) |
| `[right]firma[/right]` | Alinear toda la línea a la derecha (alias `[靠右]…[/靠右]`) para firmas y fechas |

## Inicio rápido

1. Abre la [demostración en línea](https://shouxie.newzone.top) o importa un archivo de texto (`.txt` / `.docx` / `.md`).
2. Elige el estilo de papel, la fuente y la personalidad de escritura en el panel izquierdo, y ajusta la perturbación o la iluminación de la foto según necesites (en el móvil, usa los botones segmentados «Editar / Vista previa» de la parte superior para cambiar de columna).
3. Haz clic en "Exportar" en la barra superior para descargar imágenes en alta resolución (PNG / JPG), un ZIP con todas las páginas, un PDF multipágina o imprimir directamente a tamaño real en milímetros.

## Limitaciones

- La composición para alfabetos latino y CJK usa estimación de ancho de glifo para garantizar rendimiento instantáneo en documentos extensos (solo el árabe usa medición nativa en Canvas). En fuentes muy atípicas el final de línea puede variar ligeramente.
- La impresión desde el navegador solo imprime la página actual; utiliza la exportación a PDF para imprimir el documento completo.
- En versiones de Safari anteriores a la 16, la falta de soporte para `ctx.filter` inhabilita los ajustes de brillo y contraste del papel.
- La capa de dibujo manual se almacena en memoria vinculada al número de página; cambios grandes en el texto que repaginen el documento pueden desfasar los dibujos.
- De las fuentes integradas, 4 se incluyen para uso sin conexión; las otras 4 (Liu Jian Mao Cao, ZCOOL XiaoWei, Caveat, Kalam) se cargan desde Google Fonts en tiempo de ejecución y, sin conexión o en redes internas, recurren a fuentes del sistema.
- Las fuentes importadas localmente `.ttf` / `.otf` / `.woff` / `.woff2` se conservan únicamente en la memoria de la sesión actual y deben volver a seleccionarse al recargar.

## Desarrollo local

Requiere Node.js **22.12+ / 24+ / 26+**:

```bash
npm install
npm run dev        # servidor local en http://localhost:5173/
npm test           # ejecutar pruebas unitarias con Vitest
npm run lint       # análisis de código con oxlint
npm run build      # compilar para producción (tsc + vite)
```

La salida en `dist/` utiliza rutas relativas (`base: './'`), lo que permite alojarla en GitHub Pages o cualquier servidor web. Consulta [docs/development.md](../development.md) para conocer la arquitectura y cómo añadir idiomas.

## Licencia

- **Código**: Licencia MIT, consulta [LICENSE](../../LICENSE)
- **Fuentes**: Las fuentes en `public/fonts/` están bajo licencia SIL Open Font License (OFL), consulta [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Este proyecto es una implementación independiente y no guarda relación con herramientas de terceros.

## Sobre el Plan 365 de código abierto

Proyecto **#039** del [Plan 365 de código abierto](https://github.com/rockbenben/365opensource) — una persona + IA, más de 300 proyectos de código abierto en un año.

[Envía tu idea →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
