import { describe, expect, it } from "vitest";
import {
  breakdownByCategory,
  computeBudgetPace,
  computeBudgetStatus,
  computeMonthlySummary,
  compareMonths,
  generateAlerts,
  generateBudgetPaceAlerts,
  generateInsights,
  type ExpenseLike,
  type IncomeLike,
} from "../src/services/calculations.js";

function expense(overrides: Partial<ExpenseLike> = {}): ExpenseLike {
  return {
    id: Math.random().toString(36),
    amountPaise: 100000,
    date: new Date("2026-09-05"),
    userId: "u1",
    categoryId: "c1",
    paymentMethod: "CASH",
    ...overrides,
  };
}

function income(overrides: Partial<IncomeLike> = {}): IncomeLike {
  return { id: Math.random().toString(36), amountPaise: 20000000, userId: "u1", ...overrides };
}

describe("computeMonthlySummary", () => {
  it("computes the worked example from the spec: income 2,00,000 / expenses 1,60,000 / credit card 30,000", () => {
    const incomes = [income({ amountPaise: 20000000 })];
    const expenses = [
      expense({ amountPaise: 13000000, paymentMethod: "CASH" }),
      expense({ amountPaise: 3000000, paymentMethod: "CREDIT_CARD" }),
    ];

    const summary = computeMonthlySummary(expenses, incomes);

    expect(summary.totalIncomePaise).toBe(20000000);
    expect(summary.totalExpensePaise).toBe(16000000);
    expect(summary.creditCardPaise).toBe(3000000);
    expect(summary.nonCreditPaise).toBe(13000000);
    expect(summary.remainingPaise).toBe(4000000);
    expect(summary.savingsPaise).toBe(4000000);
    expect(summary.expenseRatioPercent).toBe(80);
    expect(summary.creditCardDependencePercent).toBe(18.8); // 30000/160000 = 18.75 rounded to 1dp
  });

  it("handles overspending: expenses exceed income", () => {
    const incomes = [income({ amountPaise: 20000000 })];
    const expenses = [expense({ amountPaise: 22000000 })];

    const summary = computeMonthlySummary(expenses, incomes);

    expect(summary.remainingPaise).toBe(-2000000);
    expect(summary.savingsPaise).toBe(-2000000);
    expect(summary.expenseRatioPercent).toBe(110);
  });

  it("handles zero income without throwing or producing NaN/Infinity", () => {
    const summary = computeMonthlySummary([expense({ amountPaise: 500000 })], []);

    expect(summary.totalIncomePaise).toBe(0);
    expect(summary.expenseRatioPercent).toBe(0);
    expect(summary.savingsRatePercent).toBe(0);
    expect(Number.isFinite(summary.expenseRatioPercent)).toBe(true);
  });

  it("handles zero expenses", () => {
    const summary = computeMonthlySummary([], [income({ amountPaise: 10000000 })]);

    expect(summary.totalExpensePaise).toBe(0);
    expect(summary.creditCardDependencePercent).toBe(0);
    expect(summary.remainingPaise).toBe(10000000);
  });

  it("handles no transactions and no income at all", () => {
    const summary = computeMonthlySummary([], []);

    expect(summary.totalIncomePaise).toBe(0);
    expect(summary.totalExpensePaise).toBe(0);
    expect(summary.remainingPaise).toBe(0);
    expect(summary.transactionCount).toBe(0);
  });

  it("does not double count or subtract credit card spending from total expenses", () => {
    const expenses = [
      expense({ amountPaise: 100000, paymentMethod: "CREDIT_CARD" }),
      expense({ amountPaise: 200000, paymentMethod: "UPI" }),
    ];
    const summary = computeMonthlySummary(expenses, [income({ amountPaise: 1000000 })]);

    expect(summary.totalExpensePaise).toBe(300000);
    expect(summary.creditCardPaise).toBe(100000);
  });
});

describe("breakdownByCategory", () => {
  it("groups and sorts by amount descending, with correct percentages", () => {
    const expenses = [
      expense({ categoryId: "groceries", amountPaise: 300000 }),
      expense({ categoryId: "petrol", amountPaise: 100000 }),
      expense({ categoryId: "groceries", amountPaise: 100000 }),
    ];
    const breakdown = breakdownByCategory(expenses, { groceries: "Groceries", petrol: "Petrol" });

    expect(breakdown[0].label).toBe("Groceries");
    expect(breakdown[0].amountPaise).toBe(400000);
    expect(breakdown[0].transactionCount).toBe(2);
    expect(breakdown[0].percentOfTotal).toBe(80);
    expect(breakdown[1].label).toBe("Petrol");
    expect(breakdown[1].percentOfTotal).toBe(20);
  });

  it("returns an empty array for no expenses", () => {
    expect(breakdownByCategory([], {})).toEqual([]);
  });
});

describe("generateAlerts", () => {
  const thresholds = { warningThresholdPercent: 70, criticalThresholdPercent: 100, creditCardWarningPaise: 4000000 };

  it("reports a healthy savings message under the warning threshold", () => {
    const summary = computeMonthlySummary([expense({ amountPaise: 10000000 })], [income({ amountPaise: 20000000 })]);
    const alerts = generateAlerts(summary, thresholds);
    expect(alerts.some((a) => a.severity === "info" && a.message.includes("saved"))).toBe(true);
  });

  it("warns between the warning and critical thresholds", () => {
    const summary = computeMonthlySummary([expense({ amountPaise: 15600000 })], [income({ amountPaise: 20000000 })]); // 78%
    const alerts = generateAlerts(summary, thresholds);
    expect(alerts.some((a) => a.severity === "warning" && a.message.includes("78%"))).toBe(true);
  });

  it("flags critical when expenses reach exactly the income", () => {
    const summary = computeMonthlySummary([expense({ amountPaise: 20000000 })], [income({ amountPaise: 20000000 })]);
    const alerts = generateAlerts(summary, thresholds);
    expect(alerts.some((a) => a.severity === "critical")).toBe(true);
  });

  it("flags overspending with the exact overage amount", () => {
    const summary = computeMonthlySummary([expense({ amountPaise: 21850000 })], [income({ amountPaise: 20000000 })]);
    const alerts = generateAlerts(summary, thresholds);
    expect(alerts.some((a) => a.message.includes("18,500 more"))).toBe(true);
  });

  it("adds a credit card warning above the configured threshold", () => {
    const summary = computeMonthlySummary(
      [expense({ amountPaise: 4200000, paymentMethod: "CREDIT_CARD" })],
      [income({ amountPaise: 20000000 })]
    );
    const alerts = generateAlerts(summary, thresholds);
    expect(alerts.some((a) => a.message.includes("Credit card spending is") && a.message.includes("42,000"))).toBe(true);
  });

  it("warns when expenses exist but there is no income recorded", () => {
    const summary = computeMonthlySummary([expense({ amountPaise: 100000 })], []);
    const alerts = generateAlerts(summary, thresholds);
    expect(alerts.some((a) => a.message.includes("No income has been recorded"))).toBe(true);
  });
});

describe("compareMonths", () => {
  it("computes month over month percent changes", () => {
    const current = computeMonthlySummary([expense({ amountPaise: 17250000 })], [income({ amountPaise: 21000000 })]);
    const previous = computeMonthlySummary([expense({ amountPaise: 15500000 })], [income({ amountPaise: 20000000 })]);

    const comparison = compareMonths(current, previous);
    expect(comparison.expenseChangePaise).toBe(1750000);
    expect(comparison.expenseChangePercent).toBeCloseTo(11.3, 1);
  });

  it("treats a previous value of zero as a 100% increase when current is nonzero", () => {
    const current = computeMonthlySummary([expense({ amountPaise: 100000 })], []);
    const previous = computeMonthlySummary([], []);
    const comparison = compareMonths(current, previous);
    expect(comparison.expenseChangePercent).toBe(100);
  });
});

describe("computeBudgetStatus", () => {
  it("flags warning and critical severities at the configured thresholds", () => {
    const categoryBreakdown = breakdownByCategory(
      [expense({ categoryId: "groceries", amountPaise: 2275000 })],
      { groceries: "Groceries" }
    );
    const status = computeBudgetStatus(
      [{ categoryId: "groceries", amountPaise: 2500000 }],
      categoryBreakdown,
      { groceries: "Groceries" },
      80,
      100
    );

    expect(status[0].percentUsed).toBe(91);
    expect(status[0].severity).toBe("warning");
  });

  it("marks a budget critical once actual spend reaches or exceeds it", () => {
    const categoryBreakdown = breakdownByCategory([expense({ categoryId: "petrol", amountPaise: 1300000 })], {
      petrol: "Petrol",
    });
    const status = computeBudgetStatus(
      [{ categoryId: "petrol", amountPaise: 1200000 }],
      categoryBreakdown,
      { petrol: "Petrol" },
      80,
      100
    );
    expect(status[0].severity).toBe("critical");
  });

  it("shows 0% used when there is no spending yet in the category", () => {
    const status = computeBudgetStatus([{ categoryId: "petrol", amountPaise: 1200000 }], [], { petrol: "Petrol" }, 80, 100);
    expect(status[0].percentUsed).toBe(0);
    expect(status[0].severity).toBe("info");
  });
});

describe("computeBudgetPace", () => {
  it("projects a category to exceed its budget when early spending is already running hot", () => {
    // 10 days into a 30-day month, already spent 40% of a ₹10,000 budget -> projected 120%
    const status = computeBudgetStatus(
      [{ categoryId: "dining", amountPaise: 1000000 }],
      breakdownByCategory([expense({ categoryId: "dining", amountPaise: 400000 })], { dining: "Dining" }),
      { dining: "Dining" },
      80,
      100
    );
    const pace = computeBudgetPace(status, 10, 30, 100);
    expect(pace[0].projectedPaise).toBe(1200000);
    expect(pace[0].projectedPercentUsed).toBe(120);
    expect(pace[0].onPaceToExceed).toBe(true);
  });

  it("does not flag onPaceToExceed for a category already marked critical (avoids duplicate alerts)", () => {
    const status = computeBudgetStatus(
      [{ categoryId: "dining", amountPaise: 1500000 }],
      breakdownByCategory([expense({ categoryId: "dining", amountPaise: 1500000 })], { dining: "Dining" }),
      { dining: "Dining" },
      80,
      100
    );
    const pace = computeBudgetPace(status, 10, 30, 100);
    expect(pace[0].severity).toBe("critical");
    expect(pace[0].onPaceToExceed).toBe(false);
  });

  it("does not flag a category spending well within pace", () => {
    const status = computeBudgetStatus(
      [{ categoryId: "dining", amountPaise: 100000 }],
      breakdownByCategory([expense({ categoryId: "dining", amountPaise: 100000 })], { dining: "Dining" }),
      { dining: "Dining" },
      80,
      100
    );
    const pace = computeBudgetPace(status, 10, 30, 100);
    expect(pace[0].onPaceToExceed).toBe(false);
  });
});

describe("generateBudgetPaceAlerts", () => {
  it("emits a critical alert for an already-exceeded budget and a warning for a projected one", () => {
    const alerts = generateBudgetPaceAlerts([
      {
        categoryId: "dining",
        categoryLabel: "Dining",
        budgetPaise: 1000000,
        actualPaise: 1500000,
        remainingPaise: -500000,
        percentUsed: 150,
        severity: "critical",
        projectedPaise: 1500000,
        projectedPercentUsed: 150,
        onPaceToExceed: false,
      },
      {
        categoryId: "petrol",
        categoryLabel: "Petrol",
        budgetPaise: 1000000,
        actualPaise: 400000,
        remainingPaise: 600000,
        percentUsed: 40,
        severity: "info",
        projectedPaise: 1200000,
        projectedPercentUsed: 120,
        onPaceToExceed: true,
      },
    ]);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].message).toContain("Dining budget exceeded");
    expect(alerts[1].severity).toBe("warning");
    expect(alerts[1].message).toContain("Petrol is on pace to exceed");
  });
});

describe("generateInsights", () => {
  it("identifies the top spending category", () => {
    const expenses = [expense({ categoryId: "groceries", amountPaise: 500000 }), expense({ categoryId: "petrol", amountPaise: 100000 })];
    const summary = computeMonthlySummary(expenses, [income({ amountPaise: 2000000 })]);
    const breakdown = breakdownByCategory(expenses, { groceries: "Groceries", petrol: "Petrol" });
    const insights = generateInsights(summary, breakdown, null);
    expect(insights[0]).toContain("Groceries");
  });

  it("produces no insights for a month with no data", () => {
    const summary = computeMonthlySummary([], []);
    const insights = generateInsights(summary, [], null);
    expect(insights).toEqual([]);
  });
});
