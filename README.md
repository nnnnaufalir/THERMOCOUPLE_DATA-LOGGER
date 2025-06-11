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
