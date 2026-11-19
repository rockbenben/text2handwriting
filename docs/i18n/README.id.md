# Generator Tulisan Tangan (Text2Handwriting)

> Ubah teks biasa menjadi halaman tulisan tangan realistis, sepenuhnya di peramban tanpa unggah ke server.

[简体中文](../../README.md) · [English](../../README.en.md) · [繁體中文](README.zh-Hant.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Português](README.pt.md) · [Русский](README.ru.md) · [Italiano](README.it.md) · [العربية](README.ar.md) · [हिन्दी](README.hi.md) · [বাংলা](README.bn.md) · [ไทย](README.th.md) · [Türkçe](README.tr.md) · [Tiếng Việt](README.vi.md) · **Bahasa Indonesia**

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](../../LICENSE) [![365 Open Source Plan #039](https://img.shields.io/badge/365%20Open%20Source%20Plan-%23039-1f6feb)](https://github.com/rockbenben/365opensource)

[▶ Coba secara online](https://shouxie.newzone.top)

![Pratinjau antarmuka: teks di sebelah kiri, tulisan tangan dihasilkan di sebelah kanan](../images/hero-en.png)

Dirancang untuk tugas sekolah tulisan tangan, catatan membaca, notula rapat, dan surat resmi. Berbeda dari alat biasa yang hanya mengganti font secara kaku, Text2Handwriting menerapkan perturbasi pseudo-acak yang dikendalikan seed pada ukuran huruf, rotasi, fluktuasi garis dasar, dan kepadatan tinta. Alat ini berjalan 100% di browser tanpa akun atau pengunggahan data ke server.

## Matriks Kompatibilitas

| Dimensi | Rincian |
|---|---|
| Lingkungan | Peramban modern di desktop dan ponsel, eksekusi 100% sisi klien; pada layar sempit otomatis beralih ke ruang kerja satu kolom untuk editor/pratinjau, dapat diganti lewat tombol tersegmentasi di atas (Chrome dan Edge 103+ dapat memindai font lokal, Safari dan Firefox menggunakan deteksi bawaan) |
| Format impor | Tempel teks langsung, unggah file `.txt` / `.md` (validasi UTF-8 ketat dengan fallback GB18030), atau file `.docx` (ekstraksi sisi klien) |
| Gaya kertas | 6 jenis kertas bawaan (bergaris, kotak-kotak, A4 polos, 4 baris kaligrafi Inggris, kertas kraft, kisi titik) serta unggah foto kertas kustom dengan penyesuaian otomatis |
| Pena & efek | 4 fisika pena realistis (gel, pulpen bulu/fountain, pensil, bolpoin); pencahayaan difus, bayangan lipatan kertas, vinyet sudut, dan efek kertas antik |
| Opsi ekspor | Halaman saat ini ke PNG / JPG, semua halaman dalam arsip ZIP, PDF multi-halaman, dan cetak presisi milimeter nyata via iframe tersembunyi (hingga ~435 DPI) |
| Tipografi | Antarmuka lengkap dalam 18 bahasa; pemisah baris cerdas, aturan tanda baca CJK, tata letak dua arah bahasa Arab (BiDi RTL) dengan ligatur alami |
| Mode offline & sinkronisasi | PWA yang dapat diinstal di desktop dan ponsel; perlindungan konflik Web Locks antar tab, penyimpanan draf otomatis 250ms, dan peringatan sebelum menutup |

## Fitur Utama

- **Tulisan tangan realistis**: Perturbasi pseudo-acak yang dikendalikan seed mengatur ukuran karakter, jarak, kemiringan, pergeseran garis dasar, dan kelelahan tangan saat menulis. Setiap hasil unik, dan menyimpan seed memungkinkan Anda memproduksi ulang hasil yang 100% identik.
- **Tipografi cerdas & teks dua arah**: Lokalisasi penuh 18 bahasa; aturan awal/akhir baris CJK, indentasi paragraf, penomoran halaman otomatis, dan tanda tangan rata kanan; perlindungan kata utuh untuk alfabet latin; ligatur kursif alami dan perlindungan tanda kurung untuk bahasa Arab.
- **Tekstur kertas & foto**: Pengaturan spasi baris dan margin halaman yang fleksibel; kisi kotak proporsional; penyesuaian foto unggahan otomatis ke batas halaman A4; bayangan lipatan dan pencahayaan alami.
- **Font apa saja**: 8 font tulisan tangan sumber terbuka (4 terpaket offline + 4 dimuat dari Google Fonts). Muat font sistem, Google Fonts, atau seret file `.ttf` / `.otf` / `.woff` / `.woff2` (kompatibel dengan Calligraphr untuk menggunakan tulisan tangan sendiri).
- **Koreksi & coretan alami**: 13 gaya coretan (garis tunggal, ganda, bergelombang, corat-coret) yang dipicu oleh probabilitas realistis; coret kesalahan dan tulis koreksi di atas garis; bilah alat kanvas mendukung penggambaran panah, sketsa, dan lingkaran dengan kuas, serta penghapus, pembersihan goresan halaman ini, dan garis bantu margin.
- **Persona penulisan**: 4 prasetel (Siswa Rajin Berprestasi, Catatan Harian Spontan, Tulisan Terburu-buru, Tugas Sekolah Standar) yang menerapkan intensitas perturbasi, tekstur tulisan, dan probabilitas koreksi dalam satu klik.

## Sintaks Markup

Gunakan tag markup langsung di dalam teks untuk menentukan coretan dan sorotan secara presisi:

| Sintaks | Efek Visual |
|---|---|
| `~~salah~~` atau `[del]salah[/del]` | Coret teks |
| `[del:koreksi]salah[/del]` | Coret kesalahan dan tulis koreksi di atas baris |
| `[u]sorotan[/u]` | Garis bawah bergelombang |
| `[circle]sorotan[/circle]` | Lingkari teks (alias `[圈]…[/圈]`) |
| `[box]sorotan[/box]` | Kotak di sekitar teks (alias `[框]…[/框]`) |
| `[right]tanda tangan[/right]` | Rata kanan seluruh baris (alias `[靠右]…[/靠右]`) untuk tanda tangan dan tanggal |

## Mulai Cepat

1. Buka [demo online](https://shouxie.newzone.top) atau impor file teks (`.txt` / `.docx` / `.md`).
2. Pilih gaya kertas, font tulisan tangan, dan persona penulisan di panel kiri, lalu sesuaikan intensitas perturbasi atau pencahayaan foto bila perlu (di ponsel gunakan tombol tersegmentasi "Edit / Pratinjau" di atas untuk berpindah kolom).
3. Klik "Ekspor" di bilah atas untuk mengunduh gambar resolusi tinggi (PNG / JPG), ZIP semua halaman, PDF multi-halaman, atau mencetak langsung dalam ukuran milimeter nyata.

## Batasan

- Tipografi latin dan CJK menggunakan estimasi lebar glif untuk menjaga kecepatan rendering instan pada dokumen ratusan halaman (hanya bahasa Arab yang menggunakan pengukuran Canvas bawaan); pada font dengan glif tidak standar, ujung baris dapat sedikit bergeser.
- Fitur cetak peramban hanya mencetak halaman aktif saat ini; gunakan ekspor PDF untuk mencetak seluruh dokumen.
- Pada Safari versi di bawah 16, ketiadaan dukungan `ctx.filter` membuat pengaturan kecerahan dan kontras latar belakang tidak berfungsi.
- Lapisan gambar bebas terikat pada nomor halaman dalam memori; pengeditan teks besar yang mengubah pemotongan halaman dapat menggeser goresan gambar antar halaman.
- Dari font bawaan, 4 tersedia offline di dalam paket; 4 lainnya (Liu Jian Mao Cao, ZCOOL XiaoWei, Caveat, Kalam) dimuat dari Google Fonts saat runtime dan beralih ke font sistem saat offline atau di jaringan internal.
- File font `.ttf` / `.otf` / `.woff` / `.woff2` yang diimpor secara lokal hanya disimpan di memori sesi saat ini dan harus dipilih kembali setelah halaman dimuat ulang.

## Pengembangan Lokal

Memerlukan Node.js **22.12+ / 24+ / 26+**:

```bash
npm install
npm run dev        # jalankan server pengembangan lokal di http://localhost:5173/
npm test           # jalankan pengujian unit Vitest
npm run lint       # analisis kode statis (oxlint)
npm run build      # kompilasi produksi (tsc + vite)
```

File hasil build di `dist/` menggunakan jalur relatif (`base: './'`) dan dapat di-host di GitHub Pages atau server web apa pun. Lihat [docs/development.md](../development.md) untuk detail arsitektur dan penambahan bahasa baru.

## Lisensi

- **Kode Sumber**: Lisensi MIT, lihat [LICENSE](../../LICENSE)
- **Font**: Font yang disertakan di bawah `public/fonts/` dilisensikan di bawah SIL Open Font License (OFL), lihat [LICENSE-FONTS.md](../../LICENSE-FONTS.md)

Proyek ini adalah implementasi independen dan tidak memiliki afiliasi dengan alat tulisan tangan pihak ketiga lainnya.

## Tentang 365 Open Source Plan

Proyek **#039** dari [365 Open Source Plan](https://github.com/rockbenben/365opensource) — satu orang + AI, 300+ proyek open-source dalam setahun.

[Ajukan ide Anda →](https://365.aishort.top/) · [Discord](https://discord.gg/PZTQfJ4GjX) · [Telegram](https://t.me/aishort_top)
