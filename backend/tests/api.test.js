const request = require("supertest");
const app = require("../src/app");
const db = require("../src/utils/db");

let testToken;

beforeAll((done) => {
  // Give DB a tiny bit of time to initialize (it's synchronous in memory but write operations take a moment)
  setTimeout(done, 500);
});

afterAll((done) => {
  db.close(() => {
    done();
  });
});

describe("SS-DAS Backend API Tests", () => {
  
  it("GET / should return status", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("status", "SS-DAS backend running");
  });

  it("POST /auth/login - should fail with bad credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "wrongpassword" });
    expect(res.statusCode).toEqual(401);
  });

  it("POST /auth/login - should succeed with correct credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: "admin", password: "Security@2025" });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("token");
    testToken = res.body.token;
  });

  it("GET /auth/challenge - should require device_id", async () => {
    const res = await request(app).get("/auth/challenge");
    expect(res.statusCode).toEqual(400);
  });

  it("GET /auth/challenge - should return challenge for specific device", async () => {
    const res = await request(app).get("/auth/challenge?device_id=TEST_DEVICE_01");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("challenge");
    expect(res.body.challenge.length).toBeGreaterThan(10);
  });

  it("POST /data/ingest - should fail missing fields", async () => {
    const res = await request(app)
      .post("/data/ingest")
      .send({ device_id: "TEST" }); // Missing ciphertext, nonce, etc.
    
    expect(res.statusCode).toEqual(400);
  });
  
  it("POST /data/ingest - should reject invalid PUF response for real devices", async () => {
    // 1. Fetch challenge first so it exists in DB
    await request(app).get("/auth/challenge?device_id=SIM_01");

    // 2. Send invalid response
    const res = await request(app)
      .post("/data/ingest")
      .send({ 
        device_id: "SIM_01", 
        sensor_id: "TEST_SENS",
        ciphertext: "abc",
        nonce: "123",
        timestamp: Date.now(),
        puf_response: "invalid_hmac_string"
      });
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toMatch(/Invalid PUF Response/i);
  });

});
