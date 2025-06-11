#include <Arduino.h>
#include <WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <time.h>

// Firebase Library
#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>

// Hardware Peripheral Libraries
#include <LiquidCrystal_I2C.h>
#include "max6675.h"

// Project Configuration
#include "secrets.h"

// ===================================
// GLOBAL OBJECTS & CONSTANTS
// ===================================

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 7 * 3600); // UTC+7 (WIB) offset

// MAX6675 Pin Definitions (CLK, CS, DO)
const int MAX6675_SCK_PIN = 18;
const int MAX6675_CS_PIN = 5;
const int MAX6675_MISO_PIN = 17;

MAX6675 thermocouple(MAX6675_SCK_PIN, MAX6675_CS_PIN, MAX6675_MISO_PIN);

// LCD 16x2 I2C Object (Address, Columns, Rows)
LiquidCrystal_I2C lcd(0x27, 16, 2);

struct DateTimeComponents
{
    int year;
    int month;
    int day;
    int hour;
    int minute;
    int second;
    String iso8601;
};

// Firebase data send interval
unsigned long lastFirebaseSendMillis = 0;
const unsigned long FIREBASE_SEND_INTERVAL_MS = 60000; // 1 minute

// NTP Sync status
bool isTimeSynced = false;
unsigned long lastNtpAttemptMillis = 0;
const unsigned long NTP_RETRY_INTERVAL_MS = 5000; // Retry NTP every 5 seconds if not synced

// ===================================
// HELPER FUNCTIONS
// ===================================

void printLcd(const char *line1, const char *line2 /*= ""*/)
{
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    if (line2[0] != '\0')
    {
        lcd.setCursor(0, 1);
        lcd.print(line2);
    }
}

void connectToWiFi()
{
    printLcd("Connecting WiFi...", WIFI_SSID);
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void WiFiEvent(WiFiEvent_t event)
{
    Serial.printf("[WiFi-event] event: %d\n", event);
    switch (event)
    {
    case ARDUINO_EVENT_WIFI_STA_GOT_IP:
        Serial.println("WiFi connected, IP address:");
        Serial.println(WiFi.localIP());
        isTimeSynced = false;
        lastNtpAttemptMillis = 0;
        break;
    case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
        Serial.println("WiFi lost connection.");
        isTimeSynced = false;
        break;
    default:
        break;
    }
}

DateTimeComponents getLocalTimeComponents()
{
    DateTimeComponents dt;
    dt.year = 0;
    dt.month = 0;
    dt.day = 0;
    dt.hour = 0;
    dt.minute = 0;
    dt.second = 0;
    dt.iso8601 = "Invalid Time";

    if (!isTimeSynced && (millis() - lastNtpAttemptMillis >= NTP_RETRY_INTERVAL_MS))
    {
        timeClient.update();
        lastNtpAttemptMillis = millis();
        Serial.println("NTP update attempt initiated...");
    }

    time_t epochTime = timeClient.getEpochTime();
    struct tm *timeinfo = localtime(&epochTime);

    if (timeinfo == nullptr || epochTime < 100000)
    {
        Serial.println("Warning: Current time is invalid. NTP not synced or conversion failed.");
        isTimeSynced = false;
        return dt;
    }

    isTimeSynced = true;

    dt.year = timeinfo->tm_year + 1900;
    dt.month = timeinfo->tm_mon + 1;
    dt.day = timeinfo->tm_mday;
    dt.hour = timeinfo->tm_hour;
    dt.minute = timeinfo->tm_min;
    dt.second = timeinfo->tm_sec;

    char dateTimeStr[30];
    sprintf(dateTimeStr, "%04d-%02d-%02dT%02d:%02d:%02d",
            dt.year, dt.month, dt.day,
            dt.hour, dt.minute, dt.second);
    dt.iso8601 = String(dateTimeStr);

    return dt;
}

// ===================================
// SETUP FUNCTION
// ===================================

void setup()
{
    Serial.begin(115200);
    Serial.println("\n--- Starting ESP32 Data Logger ---");

    // Initialize LCD
    lcd.init();
    lcd.backlight();
    printLcd("Initializing...", "");
    delay(1000);

    // WiFi Connection
    WiFi.setHostname(WIFI_HOSTNAME);
    WiFi.onEvent(WiFiEvent);
    connectToWiFi();

    printLcd("Connecting WiFi...", "Waiting for IP...");
    Serial.print("Waiting for WiFi connection...");
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
        lcd.setCursor(15, 1);
        lcd.print(".");
    }
    String ipAddr = WiFi.localIP().toString();
    Serial.println("\nWiFi Connected. IP: " + ipAddr);
    printLcd("WiFi Connected!", ipAddr.c_str());
    delay(2000);

    // Initial NTP Sync (Blocking in Setup for initial Firebase auth)
    printLcd("Syncing Time...", "Blocking once...");
    timeClient.begin();
    Serial.println("Initial NTP sync (blocking in setup)...");
    unsigned long startTime = millis();
    while (!timeClient.update() && (millis() - startTime < 15000))
    { // Max 15s blocking
        timeClient.forceUpdate();
        Serial.print(".");
        lcd.setCursor(15, 1);
        lcd.print(".");
        delay(500);
    }
    if (timeClient.update())
    {
        isTimeSynced = true;
        String formattedTime = timeClient.getFormattedTime();
        Serial.println("\nInitial NTP time synced: " + formattedTime);
        printLcd("Time Synced!", formattedTime.c_str());
        delay(2000);
    }
    else
    {
        isTimeSynced = false;
        Serial.println("\nInitial NTP sync failed. Firebase connections might fail.");
        printLcd("NTP Sync Failed!", "Continuing...");
        delay(2000);
    }
    lastNtpAttemptMillis = millis();

    // Firebase Initialization
    printLcd("Connecting Firebase", "Auth...");
    config.api_key = API_KEY;
    auth.user.email = USER_EMAIL;
    auth.user.password = USER_PASSWORD;
    config.token_status_callback = tokenStatusCallback;

    Firebase.begin(&config, &auth);
    Firebase.reconnectNetwork(true);

    Serial.print("Waiting for Firebase to be ready...");
    while (!Firebase.ready())
    {
        delay(500);
        Serial.print(".");
        lcd.setCursor(15, 1);
        lcd.print(".");
    }
    Serial.println("\nFirebase is ready and authenticated.");
    printLcd("Firebase Ready!", "Authenticated.");
    delay(2000);

    // Firebase data buffer configuration
    fbdo.setBSSLBufferSize(4096, 1024);
    fbdo.setResponseSize(2048);

    // Initialize MAX6675 Sensor
    Serial.println("Initializing MAX6675...");
    delay(500); // MAX6675 stabilization time

    double initialTemp = thermocouple.readCelsius();
    if (isnan(initialTemp))
    {
        Serial.println("ERROR: Failed to read from MAX6675 sensor! Check wiring.");
        printLcd("MAX6675 Error!", "Check wiring.");
        while (1)
        {
            delay(1000);
        }
    }
    else
    {
        Serial.print("MAX6675 OK. Initial Temp: ");
        Serial.print(initialTemp);
        Serial.println(" C");
        char tempStr[17];
        sprintf(tempStr, "Temp: %.2f C", initialTemp);
        printLcd("MAX6675 OK!", tempStr);
        delay(2000);
    }

    Serial.println("\n--- System Ready! Entering Loop ---");
    printLcd("System Ready!", "Temp Logger");
    delay(2000);
}

// ===================================
// LOOP FUNCTION
// ===================================

void loop()
{
    // Check main connections (WiFi & Firebase)
    if (WiFi.isConnected() && Firebase.ready())
    {
        // Update NTP time non-blockingly and check sync status
        DateTimeComponents now = getLocalTimeComponents();

        // Only proceed if NTP time is synced
        if (isTimeSynced)
        {
            // Read Temperature
            double temperature = thermocouple.readCelsius();

            if (isnan(temperature))
            {
                Serial.println("Failed to read temperature from MAX6675!");
                printLcd("Read Error!", "MAX6675 Failed!");
            }
            else
            {
                Serial.print("Current Temp: ");
                Serial.print(temperature);
                Serial.println(" C");

                char tempStr[17];
                sprintf(tempStr, "Temp: %.2f C", temperature);

                // Send data to Firebase Firestore (based on interval)
                if (millis() - lastFirebaseSendMillis >= FIREBASE_SEND_INTERVAL_MS)
                {
                    lastFirebaseSendMillis = millis();

                    Serial.print("Sending data to Firestore. Time: ");
                    Serial.println(now.iso8601);

                    FirebaseJson content;
                    content.set("fields/timestamp/stringValue", now.iso8601);
                    content.set("fields/suhu/doubleValue", temperature);

                    String documentPath = "suhuData/" + String(timeClient.getEpochTime());

                    Serial.print("Document Path: ");
                    Serial.println(documentPath);

                    if (Firebase.Firestore.createDocument(&fbdo, PROJECT_ID, "", documentPath.c_str(), content.raw()))
                    {
                        Serial.println("Data successfully sent to Firestore.");
                        printLcd("Data Sent!", "Firebase OK!");
                        delay(1000);
                    }
                    else
                    {
                        Serial.print("Failed to send data to Firestore: ");
                        Serial.println(fbdo.errorReason());
                        printLcd("Send Failed!", fbdo.errorReason().c_str());
                        delay(2000);
                    }
                }
                else
                { // If not time to send data
                    // Display temperature and countdown on LCD
                    char timeBuf[17];
                    // Mengambil waktu dari 'now' yang sudah didapatkan dari getLocalTimeComponents()
                    // dan memastikan waktu ditampilkan dari komponen yang valid.
                    if (now.iso8601 != "Invalid Time")
                    {
                        unsigned long remainingTimeSec = (FIREBASE_SEND_INTERVAL_MS - (millis() - lastFirebaseSendMillis)) / 1000;
                        sprintf(timeBuf, "%02d:%02d:%02d Next:%lds", now.hour, now.minute, now.second, remainingTimeSec);
                    }
                    else
                    {
                        // Fallback jika waktu masih invalid
                        sprintf(timeBuf, "Time Invalid!");
                    }
                    printLcd(tempStr, timeBuf);
                }
            }
        }
        else
        { // NTP not synced
            Serial.println("NTP not synced. Displaying status, not sending data.");
            printLcd("NTP Syncing...", "Please wait...");
        }
    }
    else
    { // WiFi or Firebase not ready
        Serial.println("WiFi or Firebase not ready. Waiting for connection...");
        if (!WiFi.isConnected())
        {
            printLcd("WiFi Disconnected!", "Reconnecting...");
        }
        else if (!Firebase.ready())
        {
            printLcd("Firebase Offline!", "Reconnecting...");
        }
        delay(1000);
    }

    delay(100);
}