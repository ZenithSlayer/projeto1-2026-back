const request = require("supertest");
const app = require("./app"); // Make sure this points to your app logic file

async function runDiagnostics() {
  console.log("=== STARTING DIAGNOSTICS ===");

  const testUser = {
    email: `debug_${Date.now()}@test.com`,
    password: "Password123!",
    name: "Debug User"
  };

  try {
    // 1. Test Registration
    console.log("\n--- Testing Registration ---");
    console.log("Sending Body:", testUser);
    const regRes = await request(app).post("/users/register").send(testUser);
    
    console.log("Status Code:", regRes.statusCode);
    console.log("Response Body:", JSON.stringify(regRes.body, null, 2));

    if (regRes.statusCode !== 201) {
      console.log("❌ Registration Failed. Checking Headers...");
      console.log("Content-Type:", regRes.headers['content-type']);
    }

    // 2. Test Login
    console.log("\n--- Testing Login ---");
    const loginRes = await request(app).post("/users/login").send({
      email: testUser.email,
      password: testUser.password
    });

    console.log("Status Code:", loginRes.statusCode);
    console.log("Token Received:", loginRes.body.token ? "YES (Success)" : "NO (Failed)");

    if (!loginRes.body.token) {
      console.log("Full Login Response:", loginRes.body);
    }

  } catch (err) {
    console.error("\n💥 CRITICAL SYSTEM ERROR:");
    console.error(err);
  } finally {
    console.log("\n=== DIAGNOSTICS COMPLETE ===");
    process.exit();
  }
}

runDiagnostics();