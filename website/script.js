// Mengimpor fungsi yang diperlukan dari Firebase SDK (versi 11.9.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore, collection, orderBy, limit, onSnapshot, query, getDocs } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// --- Konfigurasi Firebase Anda ---
// GANTI NILAI-NILAI INI DENGAN KONFIGURASI SPESIFIK PROYEK FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyDoMs31m2Ynn7YVGYzrSYam4zTFDSeXfrM", // GANTI INI
  authDomain: "ujicoba-datalogger.firebaseapp.com", // GANTI INI
  databaseURL: "https://ujicoba-datalogger-default-rtdb.asia-southeast1.firebasedatabase.app", // Untuk Realtime DB, bisa diabaikan jika hanya pakai Firestore
  projectId: "ujicoba-datalogger", // GANTI INI
  storageBucket: "ujicoba-datalogger.firebasestorage.app", // GANTI INI
  messagingSenderId: "794133848944", // GANTI INI
  appId: "1:794133848944:web:b71a2e078fd823e00965b5", // GANTI INI
};

// --- Inisialisasi Firebase ---
const app = initializeApp(firebaseConfig);

// Dapatkan instance Authentication dan Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// --- Referensi ke Elemen HTML ---
const dataDisplay = document.getElementById("data-display");
const downloadButton = document.getElementById("download-button");
const historicalTableBody = document.querySelector("#historical-table tbody");
const historicalDataContainer = document.getElementById("historical-data-container");
const historicalDataMessage = historicalDataContainer.querySelector("p"); // Referensi ke paragraf pesan

// --- Konfigurasi Aplikasi ---
// Nama koleksi Firestore tempat data alat Anda berada
const collectionName = "suhuData";

// Kredensial untuk akun monitoring yang sudah Anda buat
const monitorEmail = "monitor@gmail.com";
const monitorPassword = "admin321";

// --- Proses Autentikasi ---
signInWithEmailAndPassword(auth, monitorEmail, monitorPassword)
  .then((userCredential) => {
    // Berhasil login
    console.log("Berhasil login sebagai:", userCredential.user.email);
    dataDisplay.innerHTML = "<p>Login berhasil. Memuat data...</p>";

    // --- Aktifkan Monitoring Real-time ---
    const qRealtime = query(collection(db, collectionName), orderBy("timestamp", "desc"), limit(1));

    onSnapshot(
      qRealtime,
      (snapshot) => {
        dataDisplay.innerHTML = "";
        if (snapshot.empty) {
          dataDisplay.innerHTML = "<p>Tidak ada data ditemukan.</p>";
          return;
        }
        snapshot.forEach((doc) => {
          const data = doc.data();
          let dataHtml = `<h2>Data Terbaru (${doc.id}):</h2>`;
          dataHtml += "<ul>";
          for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
              let value = data[key];
              // Untuk tampilan real-time, biarkan timestamp dalam format aslinya
              // atau Anda bisa tambahkan pemformatan jika diperlukan di sini juga
              if (typeof value === "object" && value !== null) {
                try {
                  value = JSON.stringify(value, null, 2);
                } catch (e) {
                  value = String(e);
                }
              }
              dataHtml += `<li><strong>${key}:</strong> <pre>${value}</pre></li>`;
            }
          }
          dataHtml += "</ul>";
          dataDisplay.innerHTML = dataHtml;
        });
      },
      (error) => {
        console.error("Error saat mendapatkan dokumen real-time: ", error);
        dataDisplay.innerHTML = `<p style="color: red;">Error memuat data real-time: ${error.message}</p>`;
      }
    );

    // --- Aktifkan tombol download setelah login berhasil ---
    downloadButton.disabled = false;
    downloadButton.textContent = "Download Semua Data (.csv)";

    // --- Panggil fungsi untuk memuat data historis setelah login berhasil ---
    loadHistoricalData();
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Login gagal:", errorCode, errorMessage);
    dataDisplay.innerHTML = `<p style="color: red;">Gagal login ke Firebase. Pastikan kredensial benar, metode masuk Email/Password diaktifkan di konsol Firebase, dan ada koneksi internet. (${errorMessage})</p>`;
    downloadButton.disabled = true;
    downloadButton.textContent = "Login Gagal, Tidak Bisa Download";
    historicalDataMessage.textContent = "Login gagal, tidak bisa memuat data historis.";
    historicalDataMessage.style.color = "red";
    historicalDataMessage.style.display = "block";
  });

// --- Fungsi untuk Mengunduh Data ke CSV ---
async function downloadDataAsCsv() {
  downloadButton.disabled = true;
  downloadButton.textContent = "Sedang Mengunduh...";

  try {
    const qAllData = query(
      collection(db, collectionName),
      orderBy("timestamp", "asc") // Urutkan ascending agar kronologis di CSV
    );

    const querySnapshot = await getDocs(qAllData);

    if (querySnapshot.empty) {
      alert("Tidak ada data untuk diunduh!");
      downloadButton.disabled = false;
      downloadButton.textContent = "Download Semua Data (.csv)";
      return;
    }

    let csvContent = "";
    const headerArray = ["documentId", "suhu", "timestamp"];

    // Tambahkan header ke CSV, menggunakan titik koma sebagai pemisah
    csvContent += headerArray.map((h) => `"${h.replace(/"/g, '""')}"`).join(";") + "\n";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = headerArray
        .map((header) => {
          let value;
          if (header === "documentId") {
            value = doc.id;
          } else if (data[header] !== undefined) {
            // Khusus untuk timestamp, kita format juga di CSV
            if (header === "timestamp" && typeof data[header] === "string") {
              try {
                const dateObj = new Date(data[header]); // Parsing string ISO 8601
                if (!isNaN(dateObj.getTime())) {
                  // Cek validitas tanggal
                  // Format untuk CSV sama dengan tampilan tabel
                  value = dateObj.toLocaleString("id-ID", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  });
                } else {
                  value = data[header]; // Gunakan string asli jika invalid
                }
              } catch (e) {
                value = data[header]; // Fallback jika error parsing
              }
            } else {
              value = data[header];
            }
          } else {
            value = "";
          }

          if (typeof value === "object" && value !== null) {
            try {
              value = JSON.stringify(value);
            } catch (e) {
              value = String(e);
            }
          }

          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(";");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);

      const date = new Date();
      const fileName = `suhuData_log_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}_${date.getHours().toString().padStart(2, "0")}${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}${date.getSeconds().toString().padStart(2, "0")}.csv`;

      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert("Browser Anda tidak mendukung fitur download file langsung.");
    }
  } catch (error) {
    console.error("Error saat mengunduh data:", error);
    alert(`Gagal mengunduh data: ${error.message}`);
  } finally {
    downloadButton.disabled = false;
    downloadButton.textContent = "Download Semua Data (.csv)";
  }
}

// --- Fungsi Memuat Data Historis ke Tabel ---
async function loadHistoricalData() {
  historicalTableBody.innerHTML = ""; // Bersihkan semua baris data yang ada di tbody
  historicalDataMessage.textContent = "Memuat data historis..."; // Tampilkan pesan loading
  historicalDataMessage.style.color = "#777"; // Reset warna pesan
  historicalDataMessage.style.display = "block"; // Pastikan pesan loading terlihat

  try {
    const qHistoricalData = query(
      collection(db, collectionName),
      orderBy("timestamp", "desc") // Urutkan dari terbaru ke terlama untuk tampilan tabel
      // Tambahkan .limit(jumlah_data) di sini jika ingin membatasi jumlah baris di tabel
    );

    const querySnapshot = await getDocs(qHistoricalData);

    if (querySnapshot.empty) {
      historicalDataMessage.textContent = "Tidak ada data historis ditemukan.";
      historicalTableBody.innerHTML = ""; // Pastikan tbody kosong
      historicalDataMessage.style.display = "block";
      return;
    }

    historicalDataMessage.style.display = "none"; // Sembunyikan pesan loading setelah data ada

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = historicalTableBody.insertRow();

      // Kolom ID Dokumen
      const cellId = row.insertCell();
      cellId.textContent = doc.id;

      // Kolom Suhu
      const cellSuhu = row.insertCell();
      // Coba parsing ke float untuk memastikan angka, dan format ke 2 angka di belakang koma
      cellSuhu.textContent = data.suhu !== undefined ? parseFloat(data.suhu).toFixed(2) : "-";

      // Kolom Timestamp
      const cellTimestamp = row.insertCell();
      if (data.timestamp !== undefined && typeof data.timestamp === "string") {
        try {
          const dateObj = new Date(data.timestamp); // Parsing string ISO 8601
          if (!isNaN(dateObj.getTime())) {
            // Cek apakah tanggal valid
            cellTimestamp.textContent = dateObj.toLocaleString("id-ID", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false, // Format 24 jam
            });
          } else {
            cellTimestamp.textContent = `Invalid Date: ${data.timestamp}`;
            cellTimestamp.style.color = "orange";
          }
        } catch (e) {
          console.warn("Error formatting timestamp:", data.timestamp, e);
          cellTimestamp.textContent = `Error: ${data.timestamp}`;
          cellTimestamp.style.color = "orange";
        }
      } else {
        cellTimestamp.textContent = "-";
      }
    });
  } catch (error) {
    console.error("Error saat memuat data historis:", error);
    historicalDataMessage.textContent = `Error memuat data historis: ${error.message}`;
    historicalDataMessage.style.color = "red";
    historicalDataMessage.style.display = "block";
  }
}

// --- Tambahkan Event Listener ke Tombol Download ---
downloadButton.addEventListener("click", downloadDataAsCsv);
