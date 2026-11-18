# El Yazısı Oluşturucu (Text2Handwriting)

> Düz metinleri gerçekçi el yazısı sayfalarına dönüştürün; sunucuya yükleme olmadan tamamen tarayıcınızda.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · **Türkçe** · [Tiếng Việt](README.vi.md) · [Bahasa Indonesia](README.id.md)

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Çevrimiçi deneyin](https://shouxie.newzone.top)

![Arayüz önizlemesi: solda metin girişi, sağda üretilen el yazısı sayfası](../images/hero-en.png)

El yazısı ödevler, okuma notları, toplantı tutanakları ve resmi mektuplar için tasarlandı. Yalnızca yazı tiplerini mekanik olarak değiştiren sıradan araçların aksine, Text2Handwriting tohum kontrollü sözde rastgele sapmalarla glif boyutu, eğim, taban çizgisi dalgalanması ve mürekkep yoğunluğunu ayarlar. Hiçbir hesap veya sunucuya veri yükleme gerekmeden tamamen tarayıcınızda yerel olarak çalışır.

## Uyumluluk Matrisi

| Boyut | Detaylar |
|---|---|
| Ortam | Masaüstü ve mobil modern tarayıcılar, %100 istemci tarafı (Chrome ve Edge 103+ yerel fontları listeleyebilir, Safari ve Firefox yerleşik tespiti kullanır) |
| İçe aktarma formatları | Doğrudan metin yapıştırma, `.txt` / `.md` yükleme (GB18030 desteği ile katı UTF-8 doğrulaması) veya `.docx` (istemci tarafında çıkarma) |
| Kağıt stilleri | 6 yerleşik kağıt türü (çizgili defter, kareli, boş A4, 4 çizgili İngilizce kaligrafi, kraft kağıt, noktalı ızgara) ve otomatik sığdırmalı özel kağıt fotoğrafı yükleme |
| Kalem ve efektler | 4 gerçekçi kalem fiziği (jel kalem, dolma kalem, kurşun kalem, tükenmez kalem); ortam ışığı yayılımı, katlama izi gölgeleri, köşe vinyeti ve eski kağıt efekti |
| Dışa aktarma seçenekleri | Geçerli sayfa PNG / JPG, tüm sayfalar ZIP arşivi, çok sayfalı PDF ve gizli iframe ile gerçek milimetre hassasiyetinde kayıpsız baskı (~435 DPI'a kadar) |
| Dizgi | 18 dilde tam arayüz; akıllı satır kaydırma, CJK noktalama kuralları, doğal el yazısı bağlantılı Arapça çift yönlü düzen (BiDi RTL) |
| Çevrimdışı ve senkronizasyon | Masaüstü ve mobilde yüklenebilir PWA; sekmeler arası Web Locks eşzamanlılık koruması, 250ms otomatik taslak kaydetme ve kaydedilmemiş değişiklik uyarısı |

## Temel Özellikler

- **Gerçekçi el yazısı**: Tohum kontrollü sözde rastgele sapmalar karakter boyutu, aralık, eğim, taban çizgisi kayması, çizgi kalınlığı ve yazma yorgunluğunu yönetir. Her çıktı benzersizdir ve tohumu kaydetmek aynı sonucu %100 yeniden üretmenizi sağlar.
- **Akıllı dizgi ve çift yönlü metin**: 18 dilde tam yerelleştirme; CJK satır başı/sonu kuralları, paragraf girintisi, otomatik sayfalama ve sağa dayalı imza; Latin alfabesi için kelime bölme koruması; parantez korumalı doğal Arapça bitişik el yazısı.
- **Kağıt dokuları ve fotoğraflar**: Satır aralığı ve kenar boşluklarının hassas ayarı; orantılı kare hücreler; yüklenen fotoğrafların A4 sınırlarına otomatik sığdırılması; gerçekçi katlama gölgeleri ve doğal aydınlatma.
- **İstediğiniz font**: Yerleşik 4 açık kaynaklı el yazısı yazı tipi (%100 çevrimdışı hazır). Sistem yazı tiplerini, Google Fonts'u yükleyin veya `.ttf` / `.otf` dosyalarını sürükleyip bırakın (kendi el yazınızı kullanmak için Calligraphr uyumludur).
- **Doğal düzeltmeler ve karalamalar**: Ayarlanabilir olasılıkla tetiklenen 13 üzeri çizme stili (tek çizgi, çift çizgi, dalgalı, karalama); hatalı kelimeleri çizip üstüne düzeltme yazma; oklar ve notlar için dahili serbest çizim katmanı.
- **Yazı profilleri**: Kalem türünü ve aralıkları anında yapılandıran 4 hazır profil (çalışkan öğrenci, hızlı notlar, acele taslak, resmi kopya).

## İşaretleme Sözdizimi

Üzeri çizme ve vurgulamaları metin içinde tam olarak belirtmek için satır içi işaretleme etiketlerini kullanın:

| Sözdizimi | Görsel Efekt |
|---|---|
| `~~hata~~` veya `[del]hata[/del]` | Metnin üzerini çiz |
| `[del:düzeltme]hata[/del]` | Hatayı çiz ve satırın üzerine düzeltmeyi yaz |
| `[u]vurgu[/u]` | Dalgalı alt çizgi |
| `[circle]vurgu[/circle]` | Metni daire içine al (diğer ad `[圈]…[/圈]`) |
| `[box]vurgu[/box]` | Metni kutu içine al (diğer ad `[框]…[/框]`) |

## Hızlı Başlangıç

1. [Çevrimiçi demoyu](https://shouxie.newzone.top) açın veya bir metin dosyası (`.txt` / `.docx` / `.md`) içe aktarın.
2. Sol panelden kağıt stilini, el yazısı fontunu ve yazı profilini seçin.
3. Yüksek çözünürlüklü görseller veya PDF indirmek ya da doğrudan yazıcıya göndermek için üst kısımdaki "Dışa Aktar"a tıklayın.

## Bilinen Sınırlar

- Latin ve CJK dizgisi, yüzlerce sayfalık belgelerde anlık işlem hızını korumak için tahmini glif genişlikleri kullanır (yalnızca Arapça yerel Canvas ölçümünü kullanır); standart dışı yazı tiplerinde satır sonları biraz sapabilir.
- Tarayıcı yazdırma özelliği yalnızca mevcut sayfayı yazdırır; tüm çok sayfalı belgeyi yazdırmak için PDF dışa aktarmayı kullanın.
- Safari 16 öncesi sürümlerde `ctx.filter` desteği bulunmadığından arka plan parlaklık ve kontrast ayarları çalışmaz.
- Serbest çizim katmanı bellekte sayfa indekslerine bağlıdır; sayfalama yapısını değiştiren büyük metin düzenlemeleri çizimleri sayfalar arasında kaydırabilir.
- Yerel olarak içe aktarılan font dosyaları yalnızca mevcut tarayıcı oturumunun belleğinde tutulur ve sayfa yenilendikten sonra yeniden seçilmelidir.

## Yerel Geliştirme

Node.js **22.12+ / 24+ / 26+** gereklidir:

```bash
npm install
npm run dev        # http://localhost:5173/ adresinde yerel geliştirme sunucusunu başlat
npm test           # Vitest birim testlerini çalıştır
npm run lint       # statik kod analizi (oxlint)
npm run build      # üretim derlemesi (tsc + vite)
```

`dist/` klasöründeki derleme çıktıları göreli yolları (`base: './'`) kullanır ve GitHub Pages veya herhangi bir web sunucusunda barındırılabilir. Ayrıntılar için [docs/development.md](../development.md) sayfasına bakın.

## Lisans

- **Kod**: MIT Lisansı, bkz. [LICENSE](../../LICENSE)
- **Fontlar**: `public/fonts/` altındaki fontlar SIL Open Font License (OFL) altında lisanslanmıştır, bkz. [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Bu proje bağımsız bir uygulamadır ve üçüncü taraf el yazısı araçlarıyla hiçbir bağlantısı yoktur.

## 365 Açık Kaynak Planı hakkında

[365 Açık Kaynak Planı](https://github.com/rockbenben/365opensource) kapsamındaki **#039** numaralı proje — bir kişi + yapay zeka, bir yılda 300'den fazla açık kaynak proje.

[Fikrinizi paylaşın →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
