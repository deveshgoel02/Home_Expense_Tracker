import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

const TEST_PASSWORD = "Test-Password-123";
let userId: string;
let categoryId: string;
let agent: ReturnType<typeof request.agent>;

const TEST_USER_NAME = "__api_test_user__";

beforeAll(async () => {
  const category = await prisma.category.findFirst();
  if (!category) throw new Error("Run `npm run db:seed` before running API tests");
  categoryId = category.id;

  // A dedicated, disposable user for this suite — never touches a real seeded
  // family member's account or password, so running tests can't lock anyone
  // out of the app they're actually using.
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
  const user = await prisma.user.create({
    data: { name: TEST_USER_NAME, initials: "TU", passwordHash, mustChangePassword: false },
  });
  userId = user.id;

  agent = request.agent(app);
  const loginRes = await agent.post("/api/auth/login").send({ name: user.name, password: TEST_PASSWORD });
  if (loginRes.status !== 200) throw new Error(`Test login failed: ${JSON.stringify(loginRes.body)}`);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { name: TEST_USER_NAME } });
  await prisma.$disconnect();
});

describe("GET /api/health", () => {
  it("returns ok without authentication", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Authentication", () => {
  it("rejects protected routes with no session", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("rejects login with a wrong password", async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const res = await request(app).post("/api/auth/login").send({ name: user!.name, password: "totally-wrong" });
    expect(res.status).toBe(401);
  });

  it("logs in with the correct password and never returns a password hash", async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const res = await request.agent(app).post("/api/auth/login").send({ name: user!.name, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("exposes the public member list for the login screen without a session", async () => {
    const res = await request(app).get("/api/auth/members");
    expect(res.status).toBe(200);
    expect(res.body[0].passwordHash).toBeUndefined();
  });

  it("returns the current session user from /api/auth/me", async () => {
    const res = await agent.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  it("changes password and rejects the old one afterwards", async () => {
    const changeRes = await agent
      .post("/api/auth/change-password")
      .send({ currentPassword: TEST_PASSWORD, newPassword: "New-Password-456" });
    expect(changeRes.status).toBe(204);

    const staleLogin = await request(app).post("/api/auth/login").send({ name: (await prisma.user.findUnique({ where: { id: userId } }))!.name, password: TEST_PASSWORD });
    expect(staleLogin.status).toBe(401);

    // restore for the rest of the suite
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 4);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  });
});

describe("GET /api/users", () => {
  it("returns the seeded family members without password hashes, when authenticated", async () => {
    const res = await agent.get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].passwordHash).toBeUndefined();
  });
});

describe("POST /api/users (add family member)", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/users").send({ name: "Someone New" });
    expect(res.status).toBe(401);
  });

  it("creates a new member and returns a one-time temporary password", async () => {
    const res = await agent.post("/api/users").send({ name: "Test Member" });
    expect(res.status).toBe(201);
    expect(res.body.user.name).toBe("Test Member");
    expect(res.body.temporaryPassword).toBeTruthy();
    expect(res.body.user.passwordHash).toBeUndefined();
    await prisma.user.delete({ where: { id: res.body.user.id } });
  });

  it("rejects a duplicate name", async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const res = await agent.post("/api/users").send({ name: user!.name });
    expect(res.status).toBe(409);
  });
});

describe("Expense CRUD", () => {
  let expenseId: string;

  it("rejects an expense with a missing person", async () => {
    const res = await agent.post("/api/expenses").send({
      amount: 100,
      date: new Date().toISOString(),
      categoryId,
      description: "Test",
      paymentMethod: "CASH",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a non-positive amount", async () => {
    const res = await agent.post("/api/expenses").send({
      amount: -50,
      date: new Date().toISOString(),
      userId,
      categoryId,
      description: "Test",
      paymentMethod: "CASH",
    });
    expect(res.status).toBe(400);
  });

  it("creates an expense", async () => {
    const res = await agent.post("/api/expenses").send({
      amount: 250.5,
      date: new Date().toISOString(),
      userId,
      categoryId,
      description: "Integration test expense",
      paymentMethod: "UPI",
    });
    expect(res.status).toBe(201);
    expect(res.body.amountPaise).toBe(25050);
    expect(res.body.user.passwordHash).toBeUndefined();
    expenseId = res.body.id;
  });

  it("edits the expense", async () => {
    const res = await agent.put(`/api/expenses/${expenseId}`).send({ amount: 300 });
    expect(res.status).toBe(200);
    expect(res.body.amountPaise).toBe(30000);
  });

  it("duplicates the expense", async () => {
    const res = await agent.post(`/api/expenses/${expenseId}/duplicate`);
    expect(res.status).toBe(201);
    expect(res.body.amountPaise).toBe(30000);
    expect(res.body.id).not.toBe(expenseId);
    await prisma.expense.delete({ where: { id: res.body.id } });
  });

  it("deletes the expense", async () => {
    const res = await agent.delete(`/api/expenses/${expenseId}`);
    expect(res.status).toBe(204);
  });

  it("returns 404 for a deleted expense", async () => {
    const res = await agent.put(`/api/expenses/${expenseId}`).send({ amount: 100 });
    expect(res.status).toBe(404);
  });
});

describe("Income", () => {
  it("creates and reflects an income record", async () => {
    const now = new Date();
    const res = await agent.post("/api/income").send({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      amount: 5000,
      source: "Test Income",
      userId,
    });
    expect(res.status).toBe(201);
    expect(res.body.amountPaise).toBe(500000);
    await prisma.income.delete({ where: { id: res.body.id } });
  });
});

describe("GET /api/dashboard", () => {
  it("returns a full dashboard bundle for the current month", async () => {
    const res = await agent.get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.categoryBreakdown).toBeInstanceOf(Array);
    expect(res.body.alerts).toBeInstanceOf(Array);
  });

  it("handles a month with no data gracefully", async () => {
    const res = await agent.get("/api/dashboard?month=1&year=2000");
    expect(res.status).toBe(200);
    expect(res.body.summary.totalIncomePaise).toBe(0);
    expect(res.body.summary.totalExpensePaise).toBe(0);
  });
});

describe("GET /api/reports/monthly", () => {
  it("returns a monthly report", async () => {
    const now = new Date();
    const res = await agent.get(`/api/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.topExpenses).toBeInstanceOf(Array);
  });
});

describe("GET /api/reports/member/:id", () => {
  it("returns a member report for a valid user without a password hash", async () => {
    const res = await agent.get(`/api/reports/member/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("returns 404 for an unknown user", async () => {
    const res = await agent.get(`/api/reports/member/does-not-exist`);
    expect(res.status).toBe(404);
  });
});

describe("POST /api/admin/bootstrap", () => {
  it("refuses without the correct secret", async () => {
    const res = await request(app).post("/api/admin/bootstrap").set("x-bootstrap-secret", "wrong");
    expect([401, 503]).toContain(res.status);
  });

  it("refuses once the database already has users", async () => {
    if (!process.env.BOOTSTRAP_SECRET) return; // not configured in this env; the 503 case above already covers that path
    const res = await request(app).post("/api/admin/bootstrap").set("x-bootstrap-secret", process.env.BOOTSTRAP_SECRET);
    expect(res.status).toBe(409);
  });
});
