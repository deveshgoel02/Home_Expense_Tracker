// Rule-based monthly budget planner. No external AI/LLM call — money math must
// be deterministic and auditable, not an LLM guess. "Smart" comes from blending
// three well-established personal-finance techniques:
//
// 1. The 50/30/20 rule (Elizabeth Warren, "All Your Worth") sets the top-level
//    split of income into Needs / Wants / Savings.
// 2. Category-level benchmark weights (in the spirit of the US BLS Consumer
//    Expenditure Survey, adapted for an Indian household) distribute the Needs
//    and Wants bands across the family's actual categories.
// 3. "Pay yourself first" savings — the savings band is protected before the
//    Wants band absorbs any shortfall from oversized fixed costs.
// Where the family has 3 months of real spending history in a category, that
// history is blended in (equal weight) with the benchmark, so suggestions get
// more personalized the longer the app has been used — the same pattern
// budgeting apps like YNAB/Mint use, without needing an API call.

export interface FixedItem {
  label: string;
  amountPaise: number;
  categoryId?: string | null;
}

export interface PlannerCategory {
  id: string;
  name: string;
}

export type BudgetPlanGroup = "fixed" | "essential" | "discretionary";

export interface CategoryPlan {
  categoryId: string;
  categoryName: string;
  group: BudgetPlanGroup;
  suggestedPaise: number;
  benchmarkPercentOfIncome: number;
  historicalAveragePaise: number;
}

export interface BudgetPlanResult {
  incomePaise: number;
  fixedTotalPaise: number;
  needsTargetPaise: number; // 50% of income
  wantsTargetPaise: number; // 30% of income, adjusted down if fixed costs overran the needs band
  savingsTargetPaise: number; // 20% of income, adjusted down only as a last resort
  savingsRatePercent: number;
  categories: CategoryPlan[];
  warnings: string[];
  framework: string;
}

// percentOfIncome is a relative weight used to split the essential/discretionary
// pools proportionally — it is NOT a promise that the category will receive
// exactly that percentage of total income (fixed costs and the household's own
// history change the actual split every time).
const CATEGORY_BENCHMARKS: Record<string, { percentOfIncome: number; group: "essential" | "discretionary" }> = {
  rent: { percentOfIncome: 25, group: "essential" },
  education: { percentOfIncome: 10, group: "essential" },
  medical: { percentOfIncome: 4, group: "essential" },
  insurance: { percentOfIncome: 3, group: "essential" },
  groceries: { percentOfIncome: 12, group: "essential" },
  fruits: { percentOfIncome: 2, group: "essential" },
  vegetables: { percentOfIncome: 2, group: "essential" },
  utilities: { percentOfIncome: 4, group: "essential" },
  internet: { percentOfIncome: 1.5, group: "essential" },
  mobile: { percentOfIncome: 1, group: "essential" },
  petrol: { percentOfIncome: 5, group: "essential" },
  "domestic help": { percentOfIncome: 3, group: "essential" },
  household: { percentOfIncome: 3, group: "essential" },
  repairs: { percentOfIncome: 2, group: "essential" },
  dining: { percentOfIncome: 5, group: "discretionary" },
  entertainment: { percentOfIncome: 4, group: "discretionary" },
  shopping: { percentOfIncome: 6, group: "discretionary" },
  electronics: { percentOfIncome: 3, group: "discretionary" },
  subscriptions: { percentOfIncome: 1.5, group: "discretionary" },
  travel: { percentOfIncome: 5, group: "discretionary" },
  other: { percentOfIncome: 2, group: "discretionary" },
};

const FALLBACK_BENCHMARK = { percentOfIncome: 1, group: "essential" as const };

function benchmarkFor(categoryName: string) {
  return CATEGORY_BENCHMARKS[categoryName.trim().toLowerCase()] ?? FALLBACK_BENCHMARK;
}

function formatRupees(paise: number): string {
  return Math.round(paise / 100).toLocaleString("en-IN");
}

export interface PlanBudgetInput {
  incomePaise: number;
  fixedItems: FixedItem[];
  categories: PlannerCategory[];
  historicalAverages: Record<string, number>; // categoryId -> avg monthly paise, last 3 months
}

export function planBudget(input: PlanBudgetInput): BudgetPlanResult {
  const { incomePaise, fixedItems, categories, historicalAverages } = input;
  const warnings: string[] = [];

  const fixedTotalPaise = fixedItems.reduce((s, f) => s + f.amountPaise, 0);
  const fixedCategoryIds = new Set(fixedItems.map((f) => f.categoryId).filter((id): id is string => Boolean(id)));

  if (incomePaise <= 0) {
    return {
      incomePaise: 0,
      fixedTotalPaise,
      needsTargetPaise: 0,
      wantsTargetPaise: 0,
      savingsTargetPaise: 0,
      savingsRatePercent: 0,
      categories: fixedItems
        .filter((f) => f.categoryId)
        .map((f) => ({
          categoryId: f.categoryId as string,
          categoryName: categories.find((c) => c.id === f.categoryId)?.name ?? f.label,
          group: "fixed" as const,
          suggestedPaise: f.amountPaise,
          benchmarkPercentOfIncome: 0,
          historicalAveragePaise: 0,
        })),
      warnings: ["Enter this month's income to generate variable-category suggestions."],
      framework: "50/30/20 rule + category benchmarks + 3-month spending history",
    };
  }

  const needsTargetPaise = Math.round(incomePaise * 0.5);
  const wantsTargetPaise = Math.round(incomePaise * 0.3);
  const savingsTargetPaise = Math.round(incomePaise * 0.2);

  if (fixedTotalPaise >= incomePaise) {
    warnings.push(
      `Fixed expenses (₹${formatRupees(fixedTotalPaise)}) are ₹${formatRupees(
        fixedTotalPaise - incomePaise
      )} more than this month's income. There is nothing left for variable spending or savings — review rent/EMI/education costs or add more income before planning further.`
    );
  }

  const overNeedsPaise = Math.max(0, fixedTotalPaise - needsTargetPaise);
  if (overNeedsPaise > 0 && fixedTotalPaise < incomePaise) {
    warnings.push(
      `Fixed expenses are ₹${formatRupees(fixedTotalPaise)} (${Math.round(
        (fixedTotalPaise / incomePaise) * 100
      )}% of income), above the recommended 50% "needs" ceiling. Discretionary spending and savings below have been scaled down to compensate.`
    );
  }

  // The overage eats into Wants and Savings equally, protecting "pay yourself
  // first" savings for as long as possible rather than zeroing it out first.
  const adjustedWantsTargetPaise = Math.max(0, wantsTargetPaise - Math.round(overNeedsPaise / 2));
  const adjustedSavingsTargetPaise = Math.max(0, savingsTargetPaise - Math.round(overNeedsPaise / 2));

  const disposableAfterFixedPaise = Math.max(0, incomePaise - fixedTotalPaise);
  const savingsReservePaise = Math.min(adjustedSavingsTargetPaise, disposableAfterFixedPaise);
  const variablePoolPaise = Math.max(0, disposableAfterFixedPaise - savingsReservePaise);

  const remainingNeedsTargetPaise = Math.max(0, needsTargetPaise - fixedTotalPaise);
  const targetForVariablePaise = remainingNeedsTargetPaise + adjustedWantsTargetPaise;
  const essentialSharePaise = targetForVariablePaise > 0 ? remainingNeedsTargetPaise / targetForVariablePaise : 0.6;

  const essentialPoolPaise = Math.round(variablePoolPaise * essentialSharePaise);
  const discretionaryPoolPaise = variablePoolPaise - essentialPoolPaise;

  if (savingsReservePaise > 0 && incomePaise > 0 && savingsReservePaise / incomePaise < 0.1 && fixedTotalPaise < incomePaise) {
    warnings.push(
      `At this rate you'd only save ${Math.round(
        (savingsReservePaise / incomePaise) * 100
      )}% of income this month, below the commonly recommended 20% minimum. Consider trimming discretionary categories.`
    );
  }

  const variableCategories = categories.filter((c) => !fixedCategoryIds.has(c.id));
  const essentialCategories = variableCategories.filter((c) => benchmarkFor(c.name).group === "essential");
  const discretionaryCategories = variableCategories.filter((c) => benchmarkFor(c.name).group === "discretionary");

  const hasHistory = Object.values(historicalAverages).some((v) => v > 0);

  function allocatePool(pool: number, poolCategories: PlannerCategory[]): Map<string, number> {
    const weights = poolCategories.map((c) => {
      const benchmark = benchmarkFor(c.name);
      const benchmarkPaise = (benchmark.percentOfIncome / 100) * incomePaise;
      const historicalPaise = historicalAverages[c.id] ?? 0;
      const weight = hasHistory ? 0.5 * benchmarkPaise + 0.5 * historicalPaise : benchmarkPaise;
      return { id: c.id, weight: Math.max(weight, 1) }; // every category gets a non-zero share
    });
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
    const result = new Map<string, number>();
    for (const w of weights) {
      result.set(w.id, totalWeight > 0 ? Math.round((w.weight / totalWeight) * pool) : 0);
    }
    return result;
  }

  const essentialAllocations = allocatePool(essentialPoolPaise, essentialCategories);
  const discretionaryAllocations = allocatePool(discretionaryPoolPaise, discretionaryCategories);

  const categoryPlans: CategoryPlan[] = [];

  for (const item of fixedItems) {
    if (!item.categoryId) continue;
    const category = categories.find((c) => c.id === item.categoryId);
    categoryPlans.push({
      categoryId: item.categoryId,
      categoryName: category?.name ?? item.label,
      group: "fixed",
      suggestedPaise: item.amountPaise,
      benchmarkPercentOfIncome: 0,
      historicalAveragePaise: historicalAverages[item.categoryId] ?? 0,
    });
  }

  for (const c of essentialCategories) {
    categoryPlans.push({
      categoryId: c.id,
      categoryName: c.name,
      group: "essential",
      suggestedPaise: essentialAllocations.get(c.id) ?? 0,
      benchmarkPercentOfIncome: benchmarkFor(c.name).percentOfIncome,
      historicalAveragePaise: historicalAverages[c.id] ?? 0,
    });
  }

  for (const c of discretionaryCategories) {
    categoryPlans.push({
      categoryId: c.id,
      categoryName: c.name,
      group: "discretionary",
      suggestedPaise: discretionaryAllocations.get(c.id) ?? 0,
      benchmarkPercentOfIncome: benchmarkFor(c.name).percentOfIncome,
      historicalAveragePaise: historicalAverages[c.id] ?? 0,
    });
  }

  return {
    incomePaise,
    fixedTotalPaise,
    needsTargetPaise,
    wantsTargetPaise: adjustedWantsTargetPaise,
    savingsTargetPaise: savingsReservePaise,
    savingsRatePercent: incomePaise === 0 ? 0 : Math.round((savingsReservePaise / incomePaise) * 1000) / 10,
    categories: categoryPlans,
    warnings,
    framework: hasHistory
      ? "50/30/20 rule + category benchmarks, blended with this household's last 3 months of actual spending"
      : "50/30/20 rule + category benchmarks (no spending history yet to personalize further)",
  };
}
