import { describe, expect, it } from "vitest";
import { planBudget, type PlannerCategory } from "../src/services/budgetPlanner.js";

const CATEGORIES: PlannerCategory[] = [
  { id: "rent", name: "Rent" },
  { id: "education", name: "Education" },
  { id: "medical", name: "Medical" },
  { id: "groceries", name: "Groceries" },
  { id: "petrol", name: "Petrol" },
  { id: "dining", name: "Dining" },
  { id: "entertainment", name: "Entertainment" },
  { id: "shopping", name: "Shopping" },
];

describe("planBudget", () => {
  it("allocates needs/wants/savings roughly along the 50/30/20 rule for a healthy income", () => {
    const result = planBudget({
      incomePaise: 20000000, // ₹2,00,000
      fixedItems: [
        { label: "Rent", amountPaise: 4000000, categoryId: "rent" }, // ₹40,000
        { label: "School fees", amountPaise: 1500000, categoryId: "education" }, // ₹15,000
      ],
      categories: CATEGORIES,
      historicalAverages: {},
    });

    expect(result.fixedTotalPaise).toBe(5500000);
    expect(result.needsTargetPaise).toBe(10000000); // 50% of income
    expect(result.savingsTargetPaise).toBe(4000000); // full 20% since fixed didn't breach the needs band
    expect(result.warnings).toHaveLength(0);

    const rentPlan = result.categories.find((c) => c.categoryId === "rent");
    expect(rentPlan?.group).toBe("fixed");
    expect(rentPlan?.suggestedPaise).toBe(4000000);

    // Variable categories should sum to roughly income - fixed - savings
    const variableTotal = result.categories.filter((c) => c.group !== "fixed").reduce((s, c) => s + c.suggestedPaise, 0);
    const expectedVariablePool = result.incomePaise - result.fixedTotalPaise - result.savingsTargetPaise;
    expect(Math.abs(variableTotal - expectedVariablePool)).toBeLessThan(50); // rounding slack
  });

  it("warns and protects savings for as long as possible when fixed costs breach the needs band", () => {
    const result = planBudget({
      incomePaise: 10000000, // ₹1,00,000
      fixedItems: [{ label: "Rent", amountPaise: 7000000, categoryId: "rent" }], // ₹70,000 = 70% of income
      categories: CATEGORIES,
      historicalAverages: {},
    });

    expect(result.warnings.some((w) => w.includes("50%"))).toBe(true);
    expect(result.savingsTargetPaise).toBeGreaterThan(0);
    expect(result.savingsTargetPaise).toBeLessThan(2000000); // less than the undisturbed 20% target
  });

  it("warns when fixed expenses alone exceed income and leaves no variable allocations", () => {
    const result = planBudget({
      incomePaise: 5000000,
      fixedItems: [{ label: "Rent", amountPaise: 6000000, categoryId: "rent" }],
      categories: CATEGORIES,
      historicalAverages: {},
    });

    expect(result.warnings.some((w) => w.toLowerCase().includes("more than this month's income"))).toBe(true);
    expect(result.savingsTargetPaise).toBe(0);
    const variableTotal = result.categories.filter((c) => c.group !== "fixed").reduce((s, c) => s + c.suggestedPaise, 0);
    expect(variableTotal).toBe(0);
  });

  it("handles zero income by asking for income instead of dividing by zero", () => {
    const result = planBudget({
      incomePaise: 0,
      fixedItems: [],
      categories: CATEGORIES,
      historicalAverages: {},
    });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.categories).toEqual([]);
  });

  it("blends in historical spending when available, shifting allocation toward habitual categories", () => {
    const withoutHistory = planBudget({
      incomePaise: 10000000,
      fixedItems: [],
      categories: CATEGORIES,
      historicalAverages: {},
    });
    const withHistory = planBudget({
      incomePaise: 10000000,
      fixedItems: [],
      categories: CATEGORIES,
      historicalAverages: { dining: 3000000 }, // family historically spends heavily on Dining
    });

    const diningWithout = withoutHistory.categories.find((c) => c.categoryId === "dining")!.suggestedPaise;
    const diningWith = withHistory.categories.find((c) => c.categoryId === "dining")!.suggestedPaise;
    expect(diningWith).toBeGreaterThan(diningWithout);
    expect(withHistory.framework).toContain("last 3 months");
  });
});
