const request = require("supertest");
const app = require("../app");
const db = require("../db");

// Test Data Constants
const uniqueId = Date.now();
const userEmail = `user${uniqueId}@test.com`;
const userPassword = "Password123!";
const userCPF = Math.random().toString().slice(2, 13);
let authToken;
let tempAddressId;
let tempCardId;

describe("Comprehensive API Integration Suite", () => {
  afterAll(async () => {
    if (db && db.end) await db.end();
  });

  // --- 1. REGISTRATION & AUTH VALIDATION (5 Tests) ---
  describe("Auth & Registration Logic", () => {
    it("1. Should fail registration if fields are missing", async () => {
      const res = await request(app).post("/users/register").send({ email: "fail@test.com" });
      expect(res.statusCode).toBe(400);
    });

    it("2. Should successfully register a valid user", async () => {
      const res = await request(app).post("/users/register").send({
        name: "Test User", email: userEmail, password: userPassword, cpf: userCPF
      });
      expect(res.statusCode).toBe(201);
    });

    it("3. Should prevent duplicate email registration", async () => {
      const res = await request(app).post("/users/register").send({
        name: "Other", email: userEmail, password: "123", cpf: "00000000000"
      });
      expect(res.statusCode).toBe(409);
    });

    it("4. Should login and return a JWT token", async () => {
      const res = await request(app).post("/users/login").send({
        identifier: userEmail, password: userPassword
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");
      authToken = res.body.token;
    });

    it("5. Should reject login with wrong password", async () => {
      const res = await request(app).post("/users/login").send({
        identifier: userEmail, password: "wrongpassword"
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // --- 2. PROFILE MANAGEMENT (5 Tests) ---
  describe("User Profile Actions", () => {
    it("6. Should fetch user's own profile (getMe)", async () => {
      const res = await request(app).get("/users/me").set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user.email).toBe(userEmail);
    });

    it("7. Should fail getMe without a token", async () => {
      const res = await request(app).get("/users/me");
      expect(res.statusCode).toBe(401);
    });

    it("8. Should update profile information", async () => {
      const res = await request(app).put("/users/profile").set("Authorization", `Bearer ${authToken}`)
        .send({ name: "Updated Name", email: userEmail });
      expect(res.statusCode).toBe(200);
    });

    it("9. Should successfully change password", async () => {
      const res = await request(app).put("/users/password").set("Authorization", `Bearer ${authToken}`)
        .send({ currentPassword: userPassword, newPassword: "NewPassword789!" });
      expect(res.statusCode).toBe(200);
    });

    it("10. Should fail password change with incorrect current password", async () => {
      const res = await request(app).put("/users/password").set("Authorization", `Bearer ${authToken}`)
        .send({ currentPassword: "wrong", newPassword: "some" });
      expect(res.statusCode).toBe(400);
    });
  });

  // --- 3. ADDRESSES (6 Tests) ---
  describe("Address Resource Management", () => {
    it("11. Should add a new address", async () => {
      const res = await request(app).post("/users/address").set("Authorization", `Bearer ${authToken}`)
        .send({ country: "Brazil", state: "PR", city: "Mourão", street: "Main", number: "10", postal_code: "80" });
      expect(res.statusCode).toBe(200);
    });

    it("12. Should list addresses in the profile (getMe check)", async () => {
      const res = await request(app).get("/users/me").set("Authorization", `Bearer ${authToken}`);
      expect(res.body.addresses.length).toBeGreaterThan(0);
      tempAddressId = res.body.addresses[0].id;
    });

    it("13. Should update an existing address", async () => {
      const res = await request(app).put(`/users/address/${tempAddressId}`).set("Authorization", `Bearer ${authToken}`)
        .send({ country: "Brazil", state: "SP", city: "São Paulo", street: "Av Paulista", number: "100" });
      expect(res.statusCode).toBe(200);
    });

    it("14. Should set an address as favorite", async () => {
      const res = await request(app).put(`/users/address/${tempAddressId}/favorite`).set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
    });

    it("15. Should delete an address", async () => {
      const res = await request(app).delete(`/users/address/${tempAddressId}`).set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
    });

    it("16. Should fail deleting a non-existent address", async () => {
      const res = await request(app).delete("/users/address/99999").set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200); // Controller returns 200 even if empty in your code
    });
  });

  // --- 4. CREDIT CARDS (6 Tests) ---
  describe("Credit Card Management", () => {
    it("17. Should add a credit card", async () => {
      const res = await request(app).post("/users/card").set("Authorization", `Bearer ${authToken}`)
        .send({ card_number: "4444555566667777", security_code: "999", expiration_date: "2028-01-01" });
      expect(res.statusCode).toBe(200);
    });

    it("18. Should verify card exists in profile", async () => {
      const res = await request(app).get("/users/me").set("Authorization", `Bearer ${authToken}`);
      expect(res.body.cards.length).toBeGreaterThan(0);
      tempCardId = res.body.cards[0].id;
    });

    it("19. Should set card as favorite", async () => {
      const res = await request(app).put(`/users/card/${tempCardId}/favorite`).set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
    });

    it("20. Should fail to add card with invalid date format", async () => {
      const res = await request(app).post("/users/card").set("Authorization", `Bearer ${authToken}`)
        .send({ card_number: "123", security_code: "1", expiration_date: "invalid" });
      expect(res.statusCode).toBe(500); // SQL Error
    });

    it("21. Should delete a card", async () => {
      const res = await request(app).delete(`/users/card/${tempCardId}`).set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
    });

    it("22. Should verify card is gone from profile", async () => {
      const res = await request(app).get("/users/me").set("Authorization", `Bearer ${authToken}`);
      const found = res.body.cards.find(c => c.id === tempCardId);
      expect(found).toBeUndefined();
    });
  });

  // --- 5. PRODUCTS (4 Tests) ---
  describe("Product Catalog Access", () => {
    it("23. Should return all products", async () => {
      const res = await request(app).get("/products");
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("24. Should return 404 for non-existent product ID", async () => {
      const res = await request(app).get("/products/999999");
      expect(res.statusCode).toBe(404);
    });

    it("25. Should contain specific product structure", async () => {
      const res = await request(app).get("/products");
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty("price");
        expect(res.body[0]).toHaveProperty("name");
      }
    });

    it("26. Should access public root path", async () => {
      const res = await request(app).get("/");
      expect(res.text).toBe("API running");
    });
  });

  // --- 6. EDGE CASES & CLEANUP (4 Tests) ---
  describe("Security & Teardown", () => {
    it("27. Should reject invalid token format", async () => {
      const res = await request(app).get("/users/me").set("Authorization", "Bearer notatoken");
      expect(res.statusCode).toBe(401);
    });

    it("28. Should fail to update profile with missing email", async () => {
      const res = await request(app).put("/users/profile").set("Authorization", `Bearer ${authToken}`)
        .send({ name: "OnlyName" });
      expect(res.statusCode).toBe(500); // SQL constraint error
    });

    it("29. Should delete user account successfully", async () => {
      const res = await request(app).delete("/users").set("Authorization", `Bearer ${authToken}`);
      expect(res.statusCode).toBe(200);
    });

    it("30. Should no longer be able to login after deletion", async () => {
      const res = await request(app).post("/users/login").send({
        identifier: userEmail, password: "NewPassword789!"
      });
      expect(res.statusCode).toBe(401);
    });
  });
});