#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include "mbedtls/gcm.h"
#include "mbedtls/base64.h"
#include "mbedtls/md.h"
#include "mbedtls/pk.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ctr_drbg.h"
#include <ArduinoJson.h>

// WiFi Config
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Backend Config
const char* BACKEND_URL = "https://ss-das-web.onrender.com";

// Device/Sensor Config
const char* DEVICE_ID  = "SIM_01";
const char* SENSOR_ID  = "DHT_11_SECURE";
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// --- DEVICE SECRETS ---
// Derived AES-256 Key for E2EE (matches frontend "my_secure_password")
const unsigned char aes_key[32] = {115,64,5,254,221,144,204,171,136,253,185,233,198,117,208,65,192,251,88,5,26,50,223,191,185,205,163,84,164,183,124,147};
// Simulated PUF Secret
const char* PUF_SECRET = "MY_PUF_SECRET_KEY";

// ECDSA Private Key (secp256r1)
const char* private_key_pem = \
"-----BEGIN PRIVATE KEY-----\n" \
"MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg2UrxXvQvKPa5FzVR\n" \
"uHQU+sUC1wg1OVC7yLT3PWRUdG2hRANCAASgWYH3P7tS3A0fyAXrNJklaAQa9ADW\n" \
"YlcLsnUzMSvE4OYvYE6EXHWK0onPQSWc2tODcK4Ub+d2pVUESbq/i2/c\n" \
"-----END PRIVATE KEY-----\n";


void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nWiFi connected.");
}

String base64Encode(unsigned char* data, size_t length) {
  size_t olen = 0;
  mbedtls_base64_encode(NULL, 0, &olen, data, length);
  unsigned char* b64 = (unsigned char*)malloc(olen);
  mbedtls_base64_encode(b64, olen, &olen, data, length);
  String result = String((char*)b64);
  free(b64);
  return result;
}

String computeHMAC(String payload, const unsigned char* key, size_t key_len) {
  unsigned char hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&ctx, key, key_len);
  mbedtls_md_hmac_update(&ctx, (const unsigned char *) payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String hex = "";
  for(int i=0; i<32; i++) {
    char buf[3];
    sprintf(buf, "%02x", hmacResult[i]);
    hex += String(buf);
  }
  return hex;
}

String computeECDSASignature(String dataToSign) {
  mbedtls_pk_context pk;
  mbedtls_entropy_context entropy;
  mbedtls_ctr_drbg_context ctr_drbg;
  mbedtls_pk_init(&pk);
  mbedtls_entropy_init(&entropy);
  mbedtls_ctr_drbg_init(&ctr_drbg);
  const char* pers = "ecdsa_signer";
  mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy, (const unsigned char *) pers, strlen(pers));

  // Parse ECDSA Key
  mbedtls_pk_parse_key(&pk, (const unsigned char*)private_key_pem, strlen(private_key_pem)+1, NULL, 0, mbedtls_ctr_drbg_random, &ctr_drbg);

  // Hash the data
  unsigned char hash[32];
  mbedtls_md(mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), (const unsigned char*)dataToSign.c_str(), dataToSign.length(), hash);

  // Sign it
  unsigned char sig[MBEDTLS_MPI_MAX_SIZE];
  size_t sig_len = 0;
  mbedtls_pk_sign(&pk, MBEDTLS_MD_SHA256, hash, 0, sig, sizeof(sig), &sig_len, mbedtls_ctr_drbg_random, &ctr_drbg);

  String sigB64 = base64Encode(sig, sig_len);

  mbedtls_pk_free(&pk);
  mbedtls_ctr_drbg_free(&ctr_drbg);
  mbedtls_entropy_free(&entropy);
  return sigB64;
}

String fetchPUFChallenge() {
  HTTPClient http;
  String url = String(BACKEND_URL) + "/auth/challenge?device_id=" + String(DEVICE_ID);
  http.begin(url);
  int httpCode = http.GET();
  String challenge = "";
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    // Simple extraction since ArduinoJson might be heavy, but ideal to use it
    int index = payload.indexOf("\"challenge\":\"");
    if(index > 0) {
      challenge = payload.substring(index + 13, payload.indexOf("\"", index + 13));
    }
  }
  http.end();
  return challenge;
}

void processAndSendSecureReading(float temp, float hum) {
  if (WiFi.status() != WL_CONNECTED) return;
  Serial.println("\n--- Starting Advanced Security Pipeline ---");

  // 1. Fetch PUF Challenge
  String challenge = fetchPUFChallenge();
  if(challenge == "") {
    Serial.println("Failed to fetch PUF challenge. Aborting.");
    return;
  }
  
  // 2. Compute PUF Response (HMAC of challenge + PUF Secret)
  String puf_response = computeHMAC(challenge, (const unsigned char*)PUF_SECRET, strlen(PUF_SECRET));

  // 3. Encrypt Payload (AES-256-GCM)
  String plaintext = "{\"temperature\":" + String(temp, 2) + ",\"humidity\":" + String(hum, 2) + "}";
  unsigned char* pt = (unsigned char*)plaintext.c_str();
  size_t pt_len = plaintext.length();

  unsigned char nonce[12];
  for(int i=0; i<12; i++) nonce[i] = random(0, 256);

  mbedtls_gcm_context ctx;
  mbedtls_gcm_init(&ctx);
  mbedtls_gcm_setkey(&ctx, MBEDTLS_CIPHER_ID_AES, aes_key, 256);

  unsigned char* ciphertext = (unsigned char*)malloc(pt_len);
  unsigned char tag[16];
  mbedtls_gcm_crypt_and_tag(&ctx, MBEDTLS_GCM_ENCRYPT, pt_len, nonce, 12, NULL, 0, pt, ciphertext, 16, tag);

  size_t final_len = pt_len + 16;
  unsigned char* encrypted_data = (unsigned char*)malloc(final_len);
  memcpy(encrypted_data, ciphertext, pt_len);
  memcpy(encrypted_data + pt_len, tag, 16);

  String ciphertextB64 = base64Encode(encrypted_data, final_len);
  String nonceB64      = base64Encode(nonce, 12);

  free(ciphertext); free(encrypted_data); mbedtls_gcm_free(&ctx);

  // 4. Compute HMAC for Data Integrity (E2EE)
  String data_hmac = computeHMAC(ciphertextB64, aes_key, 32);

  // 5. Compute ECDSA Signature for Non-Repudiation
  long timestamp = millis();
  String dataToSign = String(DEVICE_ID) + "|" + String(SENSOR_ID) + "|" + ciphertextB64 + "|" + nonceB64 + "|" + String(timestamp);
  String signature = computeECDSASignature(dataToSign);

  // 6. Send payload
  WiFiClientSecure client;
  client.setInsecure(); // Skips SSL verify for educational prototype
  HTTPClient http;
  
  String ingestUrl = String(BACKEND_URL) + "/data/ingest";
  if (http.begin(client, ingestUrl)) {
    http.addHeader("Content-Type", "application/json");

    String payload = "{";
    payload += "\"device_id\":\""   + String(DEVICE_ID)  + "\",";
    payload += "\"sensor_id\":\""   + String(SENSOR_ID)  + "\",";
    payload += "\"ciphertext\":\""  + ciphertextB64      + "\",";
    payload += "\"nonce\":\""       + nonceB64           + "\",";
    payload += "\"timestamp\":"     + String(timestamp)  + ",";
    payload += "\"puf_response\":\""+ puf_response       + "\",";
    payload += "\"hmac\":\""        + data_hmac          + "\",";
    payload += "\"signature\":\""   + signature          + "\"";
    payload += "}";

    int httpCode = http.POST(payload);
    Serial.printf("POST Result: %d\n", httpCode);
    http.end();
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();
  connectWiFi();
}

void loop() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  
  if (isnan(h) || isnan(t)) {
    Serial.println("DHT failed. Using Mock Data.");
    processAndSendSecureReading(22.5, 45.0);
  } else {
    processAndSendSecureReading(t, h);
  }
  delay(15000); 
}
