# 🔥 Monitoring Data Suhu Alat Real-time (Firebase Hosting) 🔥

[![Deploy with Firebase](https://firebase.tools/api/badges/deploy)](https://datalogger-thermocouple-k.web.app)

Selamat datang di proyek "Monitoring Data Suhu Alat Real-time"! Ini adalah sebuah aplikasi web sederhana yang dirancang untuk memantau data suhu yang dikirimkan secara terus-menerus ke database Firestore Firebase. Website ini memberikan tampilan data terbaru secara real-time, data historis dalam bentuk tabel, dan visualisasi grafik suhu untuk memudahkan analisis tren.

**Link Live Website:** [https://datalogger-thermocouple-k.web.app](https://datalogger-thermocouple-k.web.app)

---

## ✨ Fitur Utama

- **Monitoring Real-time:** Menampilkan data suhu terbaru yang diterima dari alat secara instan.
- **Data Historis dalam Tabel:** Menampilkan daftar lengkap semua data suhu yang pernah dicatat dalam format tabel yang rapi, diurutkan dari yang terbaru.
- **Visualisasi Grafik Suhu:** Menyajikan tren suhu dari waktu ke waktu dalam bentuk grafik garis interaktif, memudahkan identifikasi pola dan anomali.
- **Download Data:** Memungkinkan pengguna untuk mengunduh seluruh data historis dari database ke dalam format CSV yang dapat dibuka di Excel, dengan kolom yang terstruktur (Document ID, Suhu, Timestamp).
- **Autentikasi Pengguna:** Mengamankan akses data hanya untuk pengguna yang terdaftar di Firebase Authentication.
- **Indikator Loading:** Memberikan feedback visual (spinner) saat data sedang dimuat atau diunduh.
- **Desain Bersih & Responsif:** Tampilan modern dengan palet warna yang menenangkan, tipografi yang jelas, dan tata letak yang ramah pengguna.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** HTML, CSS, JavaScript (Vanilla JS)
- **Database:** Firebase Firestore
- **Autentikasi:** Firebase Authentication (Email/Password)
- **Hosting:** Firebase Hosting
- **Library JavaScript:**
  - **Firebase SDK:** Untuk interaksi dengan Firebase Firestore dan Authentication.
  - **Chart.js:** Untuk membuat visualisasi grafik suhu.
- **Deployment Tools:** Firebase CLI

---

## 🚀 Cara Menggunakan/Melihat Website

Cukup kunjungi link live website: [https://datalogger-thermocouple-k.web.app](https://datalogger-thermocouple-k.web.app)

_Catatan: Website ini memerlukan login ke Firebase Authentication. Kredensial hardcoded di `script.js` untuk tujuan demo/monitoring pribadi. Untuk penggunaan produksi yang lebih aman, disarankan untuk mengimplementasikan form login._

---

## ⚙️ Struktur Proyek

```
├── index.html          # Struktur utama halaman web
├── style.css           # Styling dan tampilan website
├── script.js           # Logika JavaScript, interaksi Firebase, grafik, dan download
├── firebase.json       # Konfigurasi Firebase Hosting
└── .firebaserc         # Konfigurasi proyek Firebase CLI
```
