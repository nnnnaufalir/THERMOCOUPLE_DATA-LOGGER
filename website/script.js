// Mengimpor fungsi yang diperlukan dari Firebase SDK (versi 11.9.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore, collection, orderBy, limit, onSnapshot, query, getDocs } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// --- Konfigurasi Firebase Anda ---
const firebaseConfig = {
  apiKey: "AIzaSyC0Ie9Uen5q8XRofR8sC5QBdFHrKiEP2ps",
  authDomain: "datalogger-thermocouple-k.firebaseapp.com",
  projectId: "datalogger-thermocouple-k",
  storageBucket: "datalogger-thermocouple-k.firebasestorage.app",
  messagingSenderId: "1021046780893",
  appId: "1:1021046780893:web:74b745995253ff302bbc34",
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

// Pesan loading dan spinner
const realtimeLoadingMessage = document.getElementById("realtime-loading-message");
const historicalLoadingMessage = document.getElementById("historical-loading-message");
const chartLoadingMessage = document.getElementById("chart-loading-message"); // NEW
const realtimeSpinner = document.getElementById("realtime-spinner");
const historicalSpinner = document.getElementById("historical-spinner");
const downloadSpinner = document.getElementById("download-spinner");
const chartSpinner = document.getElementById("chart-spinner"); // NEW

// --- Konfigurasi Aplikasi ---
const collectionName = "suhuData";
const monitorEmail = "monitor@gmail.com";
const monitorPassword = "admin321";

// Variabel global untuk menyimpan instance chart
let temperatureChart = null; // NEW

// --- Fungsi Helper untuk Mengelola Spinner dan Pesan (SAMA SEPERTI SEBELUMNYA) ---
function showLoadingState(messageElement, spinnerElement, text = "Memuat...") {
  messageElement.textContent = text;
  messageElement.classList.remove("hidden");
  spinnerElement.classList.remove("hidden");
  spinnerElement.style.display = "block";
}

function hideLoadingState(messageElement, spinnerElement) {
  messageElement.classList.add("hidden");
  spinnerElement.classList.add("hidden");
  spinnerElement.style.display = "none";
}

function showErrorMessage(messageElement, spinnerElement, message) {
  messageElement.textContent = message;
  messageElement.style.color = "red";
  messageElement.classList.remove("hidden");
  spinnerElement.classList.add("hidden");
  spinnerElement.style.display = "none";
}

function showEmptyMessage(messageElement, spinnerElement, message) {
  messageElement.textContent = message;
  messageElement.style.color = "#777";
  messageElement.classList.remove("hidden");
  spinnerElement.classList.add("hidden");
  spinnerElement.style.display = "none";
}

// --- Proses Autentikasi (SAMA SEPERTI SEBELUMNYA, kecuali pemanggilan loadHistoricalData) ---
signInWithEmailAndPassword(auth, monitorEmail, monitorPassword)
  .then((userCredential) => {
    console.log("Berhasil login sebagai:", userCredential.user.email);

    showLoadingState(realtimeLoadingMessage, realtimeSpinner, "Login berhasil. Memuat data terbaru...");

    // --- Aktifkan Monitoring Real-time ---
    const qRealtime = query(collection(db, collectionName), orderBy("timestamp", "desc"), limit(1));

    onSnapshot(
      qRealtime,
      (snapshot) => {
        hideLoadingState(realtimeLoadingMessage, realtimeSpinner);

        if (snapshot.empty) {
          dataDisplay.innerHTML = "<p>Tidak ada data ditemukan.</p>";
          return;
        }

        dataDisplay.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          let dataHtml = `<h2>Data Terbaru (${doc.id}):</h2>`;
          dataHtml += "<ul>";
          for (const key in data) {
            if (Object.hasOwnProperty.call(data, key)) {
              let value = data[key];
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
        showErrorMessage(realtimeLoadingMessage, realtimeSpinner, `Error memuat data real-time: ${error.message}`);
        dataDisplay.innerHTML = "";
      }
    );

    // --- Aktifkan tombol download setelah login berhasil ---
    downloadButton.disabled = false;
    downloadButton.textContent = "Download Semua Data (.csv)";

    // --- Panggil fungsi untuk memuat data historis & grafik setelah login berhasil ---
    loadHistoricalData();
    loadTemperatureChart(); // Panggil fungsi load grafik setelah login berhasil
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error("Login gagal:", errorCode, errorMessage);

    showErrorMessage(realtimeLoadingMessage, realtimeSpinner, `Gagal login ke Firebase: ${errorMessage}`);
    dataDisplay.innerHTML = "";

    downloadButton.disabled = true;
    downloadButton.textContent = "Login Gagal, Tidak Bisa Download";

    showErrorMessage(historicalLoadingMessage, historicalSpinner, `Login gagal, tidak bisa memuat data historis.`);
    historicalTableBody.innerHTML = "";
    showErrorMessage(chartLoadingMessage, chartSpinner, `Login gagal, tidak bisa memuat grafik.`); // NEW
  });

// --- Fungsi untuk Mengunduh Data ke CSV (SAMA SEPERTI SEBELUMNYA) ---
async function downloadDataAsCsv() {
  downloadButton.disabled = true;
  downloadButton.textContent = "Sedang Mengunduh...";
  downloadSpinner.classList.remove("hidden");
  downloadSpinner.style.display = "block";

  try {
    const qAllData = query(collection(db, collectionName), orderBy("timestamp", "asc"));

    const querySnapshot = await getDocs(qAllData);

    if (querySnapshot.empty) {
      alert("Tidak ada data untuk diunduh!");
      return;
    }

    let csvContent = "";
    const headerArray = ["documentId", "suhu", "timestamp"];

    csvContent += headerArray.map((h) => `"${h.replace(/"/g, '""')}"`).join(";") + "\n";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = headerArray
        .map((header) => {
          let value;
          if (header === "documentId") {
            value = doc.id;
          } else if (data[header] !== undefined) {
            if (header === "timestamp" && typeof data[header] === "string") {
              try {
                const dateObj = new Date(data[header]);
                if (!isNaN(dateObj.getTime())) {
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
                  value = data[header];
                }
              } catch (e) {
                value = data[header];
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
    downloadSpinner.classList.add("hidden");
    downloadSpinner.style.display = "none";
  }
}

// --- Fungsi Memuat Data Historis ke Tabel (SAMA SEPERTI SEBELUMNYA) ---
async function loadHistoricalData() {
  historicalTableBody.innerHTML = "";
  showLoadingState(historicalLoadingMessage, historicalSpinner, "Memuat data historis...");

  try {
    const qHistoricalData = query(collection(db, collectionName), orderBy("timestamp", "desc"));

    const querySnapshot = await getDocs(qHistoricalData);

    if (querySnapshot.empty) {
      showEmptyMessage(historicalLoadingMessage, historicalSpinner, "Tidak ada data historis ditemukan.");
      historicalTableBody.innerHTML = "";
      return;
    }

    hideLoadingState(historicalLoadingMessage, historicalSpinner);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = historicalTableBody.insertRow();

      const cellId = row.insertCell();
      cellId.textContent = doc.id;

      const cellSuhu = row.insertCell();
      cellSuhu.textContent = data.suhu !== undefined ? parseFloat(data.suhu).toFixed(2) : "-";

      const cellTimestamp = row.insertCell();
      if (data.timestamp !== undefined && typeof data.timestamp === "string") {
        try {
          const dateObj = new Date(data.timestamp);
          if (!isNaN(dateObj.getTime())) {
            cellTimestamp.textContent = dateObj.toLocaleString("id-ID", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
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
    showErrorMessage(historicalLoadingMessage, historicalSpinner, `Error memuat data historis: ${error.message}`);
  }
}

// --- Fungsi Baru: Memuat Grafik Suhu ---
async function loadTemperatureChart() {
  showLoadingState(chartLoadingMessage, chartSpinner, "Memuat grafik suhu...");

  try {
    const qChartData = query(
      collection(db, collectionName),
      orderBy("timestamp", "asc"), // Urutkan dari terlama ke terbaru untuk grafik
      limit(100) // Batasi 100 data terakhir untuk grafik agar performa bagus
    );

    const querySnapshot = await getDocs(qChartData);

    if (querySnapshot.empty) {
      showEmptyMessage(chartLoadingMessage, chartSpinner, "Tidak ada data untuk grafik.");
      // Hapus chart yang mungkin sudah ada
      if (temperatureChart) {
        temperatureChart.destroy();
        temperatureChart = null;
      }
      return;
    }

    const labels = []; // Untuk timestamp
    const dataPoints = []; // Untuk suhu

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.timestamp && data.suhu !== undefined) {
        try {
          const dateObj = new Date(data.timestamp);
          if (!isNaN(dateObj.getTime())) {
            // Format label untuk sumbu X grafik
            labels.push(
              dateObj.toLocaleString("id-ID", {
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })
            );
            dataPoints.push(parseFloat(data.suhu));
          }
        } catch (e) {
          console.warn("Skipping invalid timestamp for chart:", data.timestamp, e);
        }
      }
    });

    hideLoadingState(chartLoadingMessage, chartSpinner);

    const ctx = document.getElementById("temperature-chart").getContext("2d");

    // Jika sudah ada chart, hancurkan dulu
    if (temperatureChart) {
      temperatureChart.destroy();
    }

    temperatureChart = new Chart(ctx, {
      type: "line", // Jenis grafik: garis
      data: {
        labels: labels,
        datasets: [
          {
            label: "Suhu (°C)",
            data: dataPoints,
            borderColor: "#3498db", // Warna garis
            backgroundColor: "rgba(52, 152, 219, 0.2)", // Warna area di bawah garis
            fill: true,
            tension: 0.1, // Membuat garis sedikit melengkung
            pointRadius: 3, // Ukuran titik data
            pointBackgroundColor: "#3498db",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Penting agar bisa mengatur ukuran canvas
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              font: {
                family: "Montserrat",
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                let label = context.dataset.label || "";
                if (label) {
                  label += ": ";
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toFixed(2) + " °C";
                }
                return label;
              },
            },
            titleFont: { family: "Montserrat" },
            bodyFont: { family: "Montserrat" },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Waktu",
              font: { family: "Montserrat", size: 14, weight: "600" },
            },
            ticks: {
              font: { family: "Montserrat" },
            },
            grid: {
              display: false, // Sembunyikan grid vertikal
            },
          },
          y: {
            title: {
              display: true,
              text: "Suhu (°C)",
              font: { family: "Montserrat", size: 14, weight: "600" },
            },
            ticks: {
              font: { family: "Montserrat" },
            },
            beginAtZero: false, // Suhu bisa mulai dari nilai bukan 0
          },
        },
      },
    });
  } catch (error) {
    console.error("Error saat memuat grafik suhu:", error);
    showErrorMessage(chartLoadingMessage, chartSpinner, `Error memuat grafik: ${error.message}`);
    // Jika ada error, pastikan chart juga dihancurkan
    if (temperatureChart) {
      temperatureChart.destroy();
      temperatureChart = null;
    }
  }
}

// --- Tambahkan Event Listener ke Tombol Download ---
downloadButton.addEventListener("click", downloadDataAsCsv);
