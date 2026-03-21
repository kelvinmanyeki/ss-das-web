const express = require("express");
const crypto = require("crypto");
const db = require("../utils/db");

const router = express.Router();

router.post("/ingest", (req, res) => {
  const { device_id, sensor_id, ciphertext, nonce, timestamp, puf_response, hmac, signature } = req.body;

  if (!device_id || !sensor_id || !ciphertext || !nonce || !timestamp) {
    return res.status(400).json({ error: "Missing required fields in payload" });
  }

  // 1. Verify PUF Response
  if (puf_response) {
    db.get(
      `SELECT c.challenge, d.puf_secret 
       FROM puf_challenges c
       JOIN devices d ON c.device_id = d.device_id
       WHERE c.device_id = ?`,
      [device_id],
      (err, row) => {
        if (err || !row || !row.challenge || !row.puf_secret) {
          return res.status(401).json({ error: "PUF challenge not found or missing secret" });
        }

        const expectedPuf = crypto
          .createHmac("sha256", row.puf_secret)
          .update(row.challenge)
          .digest("hex");

        if (expectedPuf !== puf_response) {
          console.warn(`[SECURITY] PUF Verification failed for ${device_id}`);
          return res.status(401).json({ error: "Invalid PUF Response. Device clone detected!" });
        }

        // 2. Verify ECDSA Signature (Optional, if device is registered with Public Key)
        verifySignatureAndStore();
      }
    );
  } else {
    // If PUF isn't strictly enforced for older prototypes, skip to signature
    verifySignatureAndStore();
  }

  function verifySignatureAndStore() {
    db.get(`SELECT public_key FROM devices WHERE device_id = ?`, [device_id], (err, row) => {
      if (row && row.public_key && signature) {
        // Construct the exact string that was signed by the ESP32
        const dataToSign = `${device_id}|${sensor_id}|${ciphertext}|${nonce}|${timestamp}`;
        try {
          const verify = crypto.createVerify('SHA256');
          verify.update(dataToSign);
          verify.end();
          
          const isValid = verify.verify(row.public_key, Buffer.from(signature, 'base64'));
          if (!isValid) {
            console.warn(`[SECURITY] ECDSA Verification failed for ${device_id}`);
            return res.status(401).json({ error: "Invalid ECDSA Signature" });
          }
        } catch (e) {
           return res.status(401).json({ error: "Signature verification error" });
        }
      }

      // 3. Store valid payload into database
      db.run(
        `INSERT INTO sensor_data (sensor_id, device_id, ciphertext, nonce, timestamp, hmac, signature)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sensor_id, device_id, ciphertext, nonce, timestamp, hmac || null, signature || null],
        (insertErr) => {
          if (insertErr) {
            return res.status(500).json({ error: "DB error while storing sensor data" });
          }
          
          // Delete used PUF challenge to prevent replay attacks
          db.run(`DELETE FROM puf_challenges WHERE device_id = ?`, [device_id]);

          res.json({ success: true, message: "Valid sensor data ingested" });
        }
      );
    });
  }
});

module.exports = router;
