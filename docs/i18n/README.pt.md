# Gerador de Manuscritos (Text2Handwriting)

> Converta texto simples em manuscritos realistas. Trabalhos, notas e cartas gerados localmente sem envio a servidores.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Português** · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Testar online](https://shouxie.newzone.top)

![Pré-visualização da interface: texto à esquerda, manuscrito gerado à direita](../images/hero-en.png)

Projetado para tarefas escolares manuscritas, anotações de leitura, atas e cartas pessoais. Diferente de ferramentas que apenas trocam fontes de forma rígida, o Text2Handwriting utiliza sementes pseudoaleatórias para perturbar tamanho, inclinação, linha de base e saturação de tinta, simulando inclusive erros e correções humanas. Funciona 100% no navegador sem cadastro ou upload.

## Matriz de compatibilidade

| Dimensão | Detalhes |
|---|---|
| Ambiente | Navegadores modernos de desktop e celular, execução 100% no cliente; em telas estreitas, alterna automaticamente para uma área de trabalho de coluna única de edição/pré-visualização, com botões segmentados no topo (Chrome e Edge 103+ suportam listagem de fontes locais; Safari e Firefox usam detecção interna) |
| Formatos de entrada | Colar texto, importar `.txt` / `.md` (validação estrita UTF-8 com suporte a GB18030) ou arquivos `.docx` (extração local) |
| Estilos de papel | 6 tipos de papel (pautado, quadriculado, A4 em branco, 4 linhas de caligrafia inglesa, papel kraft, pontilhado) e fotos personalizadas de papel com ajuste automático |
| Caneta e texturas | 4 físicas de escrita (caneta gel, tinteiro, lápis grafite, esferográfica); luz ambiente difusa, vincos de dobra, vinhetas e efeito envelhecido |
| Exportação | Página atual em PNG / JPG, todas as páginas em ZIP, PDF multipágina, impressão precisa em milímetros reais via iframe oculto (até ~435 DPI) |
| Tipografia | 18 idiomas com interface completa; quebra de linha inteligente, pontuação CJK, composição bidirecional em árabe (BiDi RTL) com ligaduras fluidas |
| Modo offline | PWA instalável no desktop e celular; proteção de concorrência com Web Locks entre abas, salvamento automático a 250ms e aviso antes de fechar |

## Funcionalidades principais

- **Escrita realista**: Perturbação pseudoaleatória controlada por semente para tamanho das letras, espaçamento, rotação, desvio de linha e fadiga ao escrever. Cada página é única e a semente permite reproduzir fielmente qualquer resultado.
- **Tipografia inteligente e bidirecional**: Regras de início e fim de linha, recuo de parágrafo, paginação automática e assinatura alinhada à direita. Suporte nativo ao árabe com ligaduras cursivas naturais e proteção de parênteses.
- **Texturas de papel e fotos**: Ajuste total de entrelinhas e margens; grade quadriculada com células quadradas proporcionais; ajuste automático de fotos para caber na folha A4; sombras de dobra e iluminação natural.
- **Fontes personalizadas**: 8 fontes manuscritas de código aberto (4 incluídas offline + 4 carregadas do Google Fonts). Carregue fontes do seu sistema, Google Fonts ou arraste arquivos `.ttf` / `.otf` / `.woff` / `.woff2` (compatível com Calligraphr para criar sua própria letra).
- **Rascunhos e correções naturais**: 13 estilos de rasura (linha simples, dupla, ondulada, rabisco) gerados com probabilidade realista; risque erros e escreva a correção em cima; a barra de ferramentas da tela permite desenhar setas, esboços e círculos à mão, com borracha, limpeza dos traços desta página e guias de margem.
- **Estilos de escrita predefinidos**: 4 personas (Estudante exemplar, Anotações espontâneas, Escrita apressada, Lição escolar regulamentar) que aplicam em um clique a intensidade da perturbação, a textura da escrita e a probabilidade de rasura.

## Sintaxe de marcação

Insira marcações diretamente no texto para indicar rasuras e destaques exatos:

| Sintaxe | Efeito visual |
|---|---|
| `~~erro~~` ou `[del]erro[/del]` | Rasurar texto |
| `[del:correção]erro[/del]` | Riscar o erro e escrever a correção acima da linha |
| `[u]destaque[/u]` | Sublinhado ondulado |
| `[circle]destaque[/circle]` | Circular o texto (alias `[圈]…[/圈]`) |
| `[box]destaque[/box]` | Enquadrar em uma caixa (alias `[框]…[/框]`) |
| `[right]assinatura[/right]` | Alinhar a linha inteira à direita (alias `[靠右]…[/靠右]`) para assinaturas e datas |

## Início rápido

1. Acesse a [demonstração online](https://shouxie.newzone.top) ou carregue um arquivo de texto (`.txt` / `.docx` / `.md`).
2. Escolha o estilo de papel, a fonte e a persona de escrita no painel esquerdo, ajustando a perturbação ou a iluminação da foto conforme necessário (no celular, use os botões segmentados "Editar / Prévia" no topo para alternar entre as colunas).
3. Clique em "Exportar" na barra superior para baixar imagens em alta resolução (PNG / JPG), um ZIP com todas as páginas, um PDF multipágina ou imprimir diretamente em milímetros reais.

## Limitações conhecidas

- A composição em alfabetos latino e CJK utiliza estimativa de largura de glifos para manter resposta instantânea em documentos longos (apenas o árabe usa medição nativa em Canvas). Em fontes muito atípicas, os finais de linha podem variar sutilmente.
- A função de impressão do navegador imprime apenas a página atual; utilize a exportação em PDF para imprimir o documento completo.
- No Safari abaixo da versão 16, a ausência de suporte a `ctx.filter` desativa os ajustes de brilho e contraste da imagem de fundo.
- A camada de desenho à mão livre fica vinculada ao número da página na memória; alterações grandes no texto que mudem a paginação podem deslocar os desenhos.
- Das fontes integradas, 4 acompanham o pacote para uso offline; as outras 4 (Liu Jian Mao Cao, ZCOOL XiaoWei, Caveat, Kalam) são carregadas do Google Fonts em tempo de execução e recorrem a fontes do sistema quando não há internet ou em redes internas.
- Fontes importadas localmente `.ttf` / `.otf` / `.woff` / `.woff2` permanecem apenas na memória da aba atual e devem ser selecionadas novamente após recarregar a página.

## Desenvolvimento local

Requer Node.js **22.12+ / 24+ / 26+**:

```bash
npm install
npm run dev        # servidor de desenvolvimento em http://localhost:5173/
npm test           # executar testes unitários (Vitest)
npm run lint       # análise estática de código (oxlint)
npm run build      # compilar para produção (tsc + vite)
```

Os arquivos gerados em `dist/` utilizam caminhos relativos (`base: './'`) e podem ser hospedados no GitHub Pages ou em qualquer servidor web. Consulte [docs/development.md](../development.md) para detalhes de arquitetura e adição de novos idiomas.

## Licença

- **Código**: Licença MIT, consulte [LICENSE](../../LICENSE)
- **Fontes**: As fontes na pasta `public/fonts/` são distribuídas sob a SIL Open Font License (OFL), consulte [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Este projeto é uma implementação independente e não possui vínculo com outras ferramentas semelhantes.

## Sobre o Plano 365 Open Source

Projeto **#039** do [Plano 365 Open Source](https://github.com/rockbenben/365opensource) — uma pessoa + IA, mais de 300 projetos open-source em um ano.

[Envie sua ideia →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
