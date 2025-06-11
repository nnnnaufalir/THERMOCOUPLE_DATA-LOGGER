# Data Logger Suhu Termokopel K (ESP32 & Firebase Firestore)

## Deskripsi Proyek

Proyek ini adalah implementasi Data Logger Suhu real-time menggunakan mikrokontroler **ESP32** dengan sensor **Termokopel Tipe K** (melalui modul MAX6675) dan tampilan **LCD 16x2 I2C**. Data suhu yang dikumpulkan akan secara berkala dikirim dan disimpan ke database **Google Firebase Firestore** melalui koneksi WiFi.

Dilengkapi dengan sebuah **aplikasi web sederhana** untuk memantau data secara _real-time_ dan kemampuan untuk mengunduh seluruh data dalam format Excel.

## Fitur Utama

- **Pembacaan Suhu Akurat**: Menggunakan Termokopel Tipe K dengan konverter MAX6675.
- **Tampilan Real-time**: Menampilkan suhu terkini, status koneksi (WiFi, NTP, Firebase), dan hitung mundur pengiriman data di LCD 16x2 I2C.
- **Konektivitas WiFi**: Terhubung ke jaringan WiFi lokal untuk pengiriman data.
- **Integrasi Firebase Firestore**: Mengirim dan menyimpan data suhu (dengan timestamp) ke database cloud Firebase Firestore.
- **Sinkronisasi Waktu Otomatis**: Menggunakan NTP (Network Time Protocol) untuk memastikan timestamp data akurat.
- **Penanganan Koneksi Tangguh**: Logika reconnection otomatis untuk WiFi dan Firebase, serta sinkronisasi waktu NTP non-blocking untuk mencegah sistem _stuck_ dan masalah koneksi SSL.
- **Status Booting Visual**: Memberikan informasi progres inisialisasi di LCD saat startup.
- **Antarmuka Web**:
  - Melihat data suhu secara _real-time_.
  - Mengunduh semua data historis dari database dalam format Excel (CSV).

## Komponen Hardware yang Dibutuhkan

- **ESP32 Development Board** (misal: ESP32 DevKitC)
- **Sensor Termokopel Tipe K**
- **Modul Konverter MAX6675** untuk Termokopel K
- **LCD 16x2 I2C** (dengan modul I2C di belakangnya, misal PCF8574)
- Kabel Jumper
- Breadboard (opsional, untuk prototipe)
- Power Supply (USB atau eksternal yang sesuai untuk ESP32)

## Diagram Pengkabelan (Wiring Diagram)

_Anda dapat menambahkan gambar atau deskripsi teks singkat tentang bagaimana setiap komponen dihubungkan ke ESP32 di sini._

- **LCD 16x2 I2C**:
  - SDA -> ESP32 GPIO21
  - SCL -> ESP32 GPIO22
  - VCC -> ESP32 5V / 3.3V (tergantung modul LCD)
  - GND -> ESP32 GND
- **MAX6675**:
  - VCC -> ESP32 3.3V
  - GND -> ESP32 GND
  - SCK (CLK) -> ESP32 GPIO18
  - CS -> ESP32 GPIO5
  - SO (DO) -> ESP32 GPIO17
- **Termokopel Tipe K**:
  - Terhubung langsung ke modul MAX6675.

## Struktur Proyek

Struktur folder proyek ini adalah sebagai berikut:

THERMOCOUPLE.../
├── .pio/ # Folder internal PlatformIO
├── .vscode/ # Konfigurasi VS Code
├── include/ # Berisi header file kustom (jika ada)
├── lib/ # Berisi library kustom (jika ada)
├── src/
│ ├── main.cpp # Kode firmware utama ESP32
│ └── secrets.h # File untuk kredensial WiFi & Firebase (TIDAK BOLEH DISHARE!)
├── test/ # Folder untuk unit testing (jika ada)
├── website/ # Folder untuk aplikasi web monitoring data
│ └── (file-file web seperti index.html, script.js, style.css, dll.)
├── .gitignore # File untuk mengabaikan file/folder tertentu dari version control (Git)
└── platformio.ini # Konfigurasi proyek PlatformIO

## Persiapan Lingkungan Pengembangan

### 1. Instalasi Visual Studio Code (VS Code)

Jika Anda belum memiliki VS Code, unduh dan instal dari situs resminya: [https://code.visualstudio.com/](https://code.visualstudio.com/)

### 2. Instalasi Ekstensi PlatformIO IDE

PlatformIO IDE adalah ekstensi powerful untuk VS Code yang mendukung pengembangan embedded.

- Buka VS Code.
- Pergi ke Extensions view (`Ctrl+Shift+X` atau klik ikon Extensions di sidebar kiri).
- Cari "PlatformIO IDE".
- Klik "Install". Ikuti petunjuk instalasi yang mungkin muncul.

### 3. Mengimpor Proyek ini ke PlatformIO

Setelah PlatformIO IDE terinstal:

- Buka VS Code.
- Dari welcome screen PlatformIO Home (jika tidak muncul, klik ikon alien PlatformIO di sidebar kiri, lalu klik "Home"), pilih **"Open Project"**.
- Navigasikan ke folder root proyek ini (`THERMOCOUPLE.../`).
- Pilih folder tersebut dan klik "Open". PlatformIO akan secara otomatis mendeteksi proyek ini sebagai proyek PlatformIO.

## Penyiapan Google Firebase

Proyek ini mengandalkan Google Firebase untuk penyimpanan data cloud. Anda perlu menyiapkan proyek Firebase sendiri untuk mendapatkan kredensial yang dibutuhkan.

### 1. Membuat Proyek Firebase Baru

- Buka [Firebase Console](https://console.firebase.google.com/).
- Klik "Add project" atau "Buat proyek".
- Ikuti langkah-langkah untuk membuat proyek baru.

### 2. Mengaktifkan Cloud Firestore Database

- Dari Firebase Console, navigasikan ke menu samping kiri dan pilih **"Build" > "Firestore Database"**.
- Klik "Create database". Pilih **"Start in production mode"**.
- Pilih lokasi server Firestore Anda (misal: `asia-southeast1`).
- Klik "Enable".

### 3. Membuat Akun Pengguna Khusus untuk ESP32

- Dari Firebase Console, navigasikan ke menu samping kiri dan pilih **"Build" > "Authentication"**.
- Klik "Get started".
- Pergi ke tab **"Sign-in method"**. Aktifkan provider **"Email/Password"**.
- Pergi ke tab **"Users"**. Klik "Add user".
- Masukkan email dan password baru yang akan digunakan oleh ESP32 (misal: `esp32.logger@yourdomain.com`).
- Klik "Add user".

### 4. Mengambil Kredensial Firebase (API Key & Project ID)

Kredensial ini akan digunakan di file `src/secrets.h`.

- Dari Firebase Console, klik ikon **"Project settings"** (roda gigi) di sidebar kiri atas.
- Di tab **"General"**, temukan **"Project ID"**. Ini adalah `PROJECT_ID`.
- Gulir ke bawah ke bagian **"Your apps"**. Jika belum ada aplikasi web, klik **"Add app"** > ikon **"Web" ($\text{</>}$)**.
- Setelah aplikasi terdaftar, cari **`apiKey`** dalam konfigurasi. Ini adalah `API_KEY`.

### 5. Mengatur Aturan Keamanan Firestore (Firestore Security Rules)

Ini adalah langkah **paling krusial** untuk memastikan ESP32 dapat menulis data.

- Dari Firebase Console, navigasikan ke menu samping kiri dan pilih **"Build" > "Firestore Database"**.
- Pergi ke tab **"Rules"**.
- Ganti aturan default dengan yang mengizinkan pengguna terautentikasi untuk menulis ke koleksi `suhuData`:

  ```firestore
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /suhuData/{docId} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```

- Klik "Publish" atau "Publikasikan".

## Konfigurasi Software (PlatformIO)

### `platformio.ini`

File ini mengonfigurasi proyek PlatformIO. Untuk detail lengkap, lihat file `platformio.ini` di root proyek.

```ini
; Lihat file platformio.ini di root proyek untuk detail lengkap.
[env:esp32dev]
platform = espressif32@5.3.0
board = esp32dev
framework = arduino
build_flags =
	-DCORE_DEBUG_LEVEL=ARDUINO_DEBUG_INFO
	-DENABLE_USER_AUTH        ; Aktifkan UserAuth
    -DENABLE_FIRESTORE        ; Aktifkan modul Firestore
upload_speed = 921600
monitor_speed = 115200
board_build.f_cpu = 240000000L
board_build.f_flash = 80000000L
lib_deps =
	arduino-libraries/NTPClient@^3.2.1
	adafruit/MAX6675 library@^1.1.2
	marcoschwartz/LiquidCrystal_I2C@^1.1.4
	mobizt/Firebase Arduino Client Library for ESP8266 and ESP32@^4.4.17
```

### `Kredensial Firebase & WiFi (src/secrets.h)`

Anda harus membuat file bernama `secrets.h` di dalam folder `src/`
`C++`

```C++
// Lihat file src/secrets.h untuk detail lengkap.
#ifndef SECRETS_H
#define SECRETS_H

#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define WIFI_HOSTNAME "esp32-temp-logger"

#define API_KEY "YOUR_FIREBASE_API_KEY"
#define PROJECT_ID "YOUR_FIREBASE_PROJECT_ID"
#define USER_EMAIL "esp32.logger@example.com"
#define USER_PASSWORD "your_password"

#endif // SECRETS_H
```

### `Struktur Database Firestore`

Data suhu akan disimpan dalam koleksi bernama `suhuData`. Setiap dokumen akan memiliki ID unik berdasarkan `Timestamp Epoch (Unix Time)` dan berisi field `timestamp` (String, ISO8601) dan `suhu` (Number/Float).

Contoh Dokumen:
`JSON`

```json
// Collection: suhuData
// Document ID: 1749448049 (Epoch Time)
{
  "timestamp": "2025-06-09T05:47:29",
  "suhu": 28.75
}
```

### Cara Penggunaan (Deployment)

-Lakukan Pengkabelan (Wiring): Hubungkan semua komponen hardware ke ESP32 sesuai diagram pengkabelan yang disediakan di atas.
Siapkan Firmware:
Buka proyek di PlatformIO IDE.
Pastikan src/secrets.h terisi.
Pastikan alamat I2C LCD di src/main.cpp benar (umumnya 0x27).
Klik ikon "Build" (tanda centang) di PlatformIO Toolbar.
Klik ikon "Upload" (tanda panah kanan) untuk mengunggah firmware ke ESP32.
Monitor Operasi:
Buka Serial Monitor (115200 baud) di PlatformIO.
Perhatikan LCD pada perangkat Anda untuk status.
Buka konsol Firebase Anda (https://console.firebase.google.com/) > Firestore Database untuk melihat data yang masuk.
Folder website/ (Web Monitoring & Data Download)
Folder website/ berisi kode untuk antarmuka web sederhana yang memungkinkan Anda melihat data secara real-time dan mengunduh data historis dalam format CSV.

Untuk detail penggunaan aplikasi web, silakan lihat website/README.md yang terpisah (jika ada) atau instruksi spesifik cara menjalankan aplikasi web Anda.

Pemecahan Masalah (Troubleshooting)
"SSL Write Error" atau Koneksi Firebase Gagal:
Pastikan waktu ESP32 tersinkronisasi dengan NTP.
Periksa kembali kredensial di src/secrets.h.
Pastikan aturan keamanan Firestore di konsol Firebase mengizinkan penulisan.
LCD tidak menampilkan apa-apa:
Periksa pengkabelan SDA/SCL.
Coba alamat I2C LCD lain (misal 0x3F atau 0x27).
Pastikan potensiometer di belakang modul I2C LCD diatur untuk kontras.
Pembacaan Suhu nan atau tidak valid:
Periksa kembali pengkabelan pin MAX6675 (SCK, CS, MISO).
Pastikan termokopel terpasang dengan benar ke modul MAX6675.
Lisensi (Opsional)
Jika Anda ingin memberikan lisensi untuk proyek Anda, seperti MIT, GPL, dll., tambahkan di sini.
