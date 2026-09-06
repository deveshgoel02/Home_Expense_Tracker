import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

let userId: string;
let categoryId: string;

beforeAll(async () => {
  const user = await prisma.user.findFirst();
  const category = await prisma.category.findFirst();
  if (!user || !category) throw new Error("Run `npm run db:seed` before running API tests");
  userId = user.id;
  categoryId = category.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/users", () => {
  it("returns exactly the 6 seeded family members when none are deactivated", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Expense CRUD", () => {
  let expenseId: string;

  it("rejects an expense with a missing person", async () => {
    const res = await request(app).post("/api/expenses").send({
      amount: 100,
      date: new Date().toISOString(),
      categoryId,
      description: "Test",
      paymentMethod: "CASH",
    });
    expect(res.status).toBe(400);
  });

  it("rejects a non-positive amount", async () => {
    const res = await request(app).post("/api/expenses").send({
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
    const res = await request(app).post("/api/expenses").send({
      amount: 250.5,
      date: new Date().toISOString(),
      userId,
      categoryId,
      description: "Integration test expense",
      paymentMethod: "UPI",
    });
    expect(res.status).toBe(201);
    expect(res.body.amountPaise).toBe(25050);
    expenseId = res.body.id;
  });

  it("edits the expense", async () => {
    const res = await request(app).put(`/api/expenses/${expenseId}`).send({ amount: 300 });
    expect(res.status).toBe(200);
    expect(res.body.amountPaise).toBe(30000);
  });

  it("duplicates the expense", async () => {
    const res = await request(app).post(`/api/expenses/${expenseId}/duplicate`);
    expect(res.status).toBe(201);
    expect(res.body.amountPaise).toBe(30000);
    expect(res.body.id).not.toBe(expenseId);
    await prisma.expense.delete({ where: { id: res.body.id } });
  });

  it("deletes the expense", async () => {
    const res = await request(app).delete(`/api/expenses/${expenseId}`);
    expect(res.status).toBe(204);
  });

  it("returns 404 for a deleted expense", async () => {
    const res = await request(app).put(`/api/expenses/${expenseId}`).send({ amount: 100 });
    expect(res.status).toBe(404);
  });
});

describe("Income", () => {
  it("creates and reflects an income record", async () => {
    const now = new Date();
    const res = await request(app).post("/api/income").send({
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
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.categoryBreakdown).toBeInstanceOf(Array);
    expect(res.body.alerts).toBeInstanceOf(Array);
  });

  it("handles a month with no data gracefully", async () => {
    const res = await request(app).get("/api/dashboard?month=1&year=2000");
    expect(res.status).toBe(200);
    expect(res.body.summary.totalIncomePaise).toBe(0);
    expect(res.body.summary.totalExpensePaise).toBe(0);
  });
});

describe("GET /api/reports/monthly", () => {
  it("returns a monthly report", async () => {
    const now = new Date();
    const res = await request(app).get(`/api/reports/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(res.body.topExpenses).toBeInstanceOf(Array);
  });
});

describe("GET /api/reports/member/:id", () => {
  it("returns a member report for a valid user", async () => {
    const res = await request(app).get(`/api/reports/member/${userId}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(userId);
  });

  it("returns 404 for an unknown user", async () => {
    const res = await request(app).get(`/api/reports/member/does-not-exist`);
    expect(res.status).toBe(404);
  });
});
