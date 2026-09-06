import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

type PaymentMethod = "CASH" | "DEBIT_CARD" | "CREDIT_CARD" | "BANK_TRANSFER" | "UPI" | "OTHER";

const prisma = new PrismaClient();

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
function generateTempPassword(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

const FAMILY_MEMBERS = [
  { name: "Vivek", initials: "VV", color: "#6366f1" },
  { name: "Rekha", initials: "RK", color: "#ec4899" },
  { name: "Dhruv", initials: "DH", color: "#0ea5e9" },
  { name: "Devesh", initials: "DV", color: "#10b981" },
  { name: "Aruna (Dadi)", initials: "AD", color: "#f59e0b" },
  { name: "Vinti", initials: "VN", color: "#8b5cf6" },
];

const CATEGORIES = [
  "Medical",
  "Travel",
  "Petrol",
  "Rent",
  "Groceries",
  "Electronics",
  "Fruits",
  "Vegetables",
  "Education",
  "Shopping",
  "Household",
  "Utilities",
  "Internet",
  "Mobile",
  "Insurance",
  "Dining",
  "Entertainment",
  "Subscriptions",
  "Repairs",
  "Domestic Help",
  "Other",
];

const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "DEBIT_CARD", "CREDIT_CARD", "BANK_TRANSFER", "UPI", "OTHER"];

const DESCRIPTIONS: Record<string, string[]> = {
  Medical: ["Doctor visit", "Pharmacy purchase", "Dental checkup", "Health checkup", "Medicines"],
  Travel: ["Weekend trip", "Train tickets", "Flight booking", "Cab fare", "Hotel stay"],
  Petrol: ["Car fuel", "Bike fuel", "Fuel top-up"],
  Rent: ["Monthly house rent"],
  Groceries: ["Monthly groceries", "Supermarket run", "Kirana store", "Big Bazaar shopping"],
  Electronics: ["Mixer grinder", "Mobile charger", "Headphones", "Laptop accessory"],
  Fruits: ["Fruit vendor", "Weekly fruits"],
  Vegetables: ["Vegetable vendor", "Weekly vegetables"],
  Education: ["School fees", "Tuition fees", "Books and stationery", "Online course"],
  Shopping: ["Clothing", "Footwear", "Festival shopping", "Gifts"],
  Household: ["Cleaning supplies", "Kitchen items", "Home decor"],
  Utilities: ["Electricity bill", "Water bill", "Gas cylinder"],
  Internet: ["Broadband bill"],
  Mobile: ["Mobile recharge", "Postpaid bill"],
  Insurance: ["Health insurance premium", "Car insurance premium", "Life insurance premium"],
  Dining: ["Restaurant dinner", "Weekend lunch", "Food delivery"],
  Entertainment: ["Movie tickets", "Streaming rental", "Amusement park"],
  Subscriptions: ["Netflix", "Spotify", "Amazon Prime", "Gym membership"],
  Repairs: ["Plumber visit", "Electrician visit", "AC servicing", "Car servicing"],
  "Domestic Help": ["Maid salary", "Cook salary", "Driver salary"],
  Other: ["Miscellaneous expense", "Donation", "Bank charges"],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

async function main() {
  console.log("Seeding database...");

  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.settings.deleteMany();

  const credentials: { name: string; password: string }[] = [];
  const users = await Promise.all(
    FAMILY_MEMBERS.map(async (m) => {
      const password = generateTempPassword();
      credentials.push({ name: m.name, password });
      const passwordHash = await bcrypt.hash(password, 12);
      return prisma.user.create({
        data: { name: m.name, initials: m.initials, color: m.color, passwordHash, mustChangePassword: true },
      });
    })
  );

  const categories = await Promise.all(CATEGORIES.map((name) => prisma.category.create({ data: { name } })));

  await prisma.settings.create({ data: { id: "singleton" } });

  const now = new Date();
  const months: { month: number; year: number }[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }

  // Income: Vivek (business), Rekha (salary), Devesh (salary), plus "Other Income" for a couple of months.
  for (const { month, year } of months) {
    await prisma.income.create({
      data: {
        month,
        year,
        amountPaise: randomInt(110000, 130000) * 100,
        source: "Business Income",
        userId: users.find((u) => u.name === "Vivek")!.id,
      },
    });
    await prisma.income.create({
      data: {
        month,
        year,
        amountPaise: randomInt(65000, 75000) * 100,
        source: "Salary",
        userId: users.find((u) => u.name === "Rekha")!.id,
      },
    });
    await prisma.income.create({
      data: {
        month,
        year,
        amountPaise: randomInt(40000, 48000) * 100,
        source: "Salary",
        userId: users.find((u) => u.name === "Devesh")!.id,
      },
    });
    if (Math.random() > 0.4) {
      await prisma.income.create({
        data: {
          month,
          year,
          amountPaise: randomInt(5000, 15000) * 100,
          source: "Other Income",
          userId: null,
        },
      });
    }
  }

  // Budgets for the current month.
  const currentPeriod = months[months.length - 1];
  const budgetCategories = ["Groceries", "Medical", "Petrol", "Shopping", "Dining", "Utilities"];
  const budgetAmounts: Record<string, number> = {
    Groceries: 25000,
    Medical: 15000,
    Petrol: 12000,
    Shopping: 10000,
    Dining: 8000,
    Utilities: 6000,
  };
  for (const name of budgetCategories) {
    const category = categories.find((c) => c.name === name)!;
    await prisma.budget.create({
      data: {
        categoryId: category.id,
        month: currentPeriod.month,
        year: currentPeriod.year,
        amountPaise: budgetAmounts[name] * 100,
      },
    });
  }

  // Expenses: ~25-30 per month across 4 months = 100-120 total.
  let expenseCount = 0;
  for (const { month, year } of months) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = month === currentPeriod.month && year === currentPeriod.year;
    const maxDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
    const numExpenses = randomInt(24, 30);

    for (let i = 0; i < numExpenses; i++) {
      const category = pick(categories);
      const user = pick(users);
      const day = randomInt(1, maxDay);
      const date = new Date(year, month - 1, day, randomInt(8, 21), randomInt(0, 59));
      const descriptionsForCategory = DESCRIPTIONS[category.name] ?? ["Expense"];

      let amountRupees: number;
      switch (category.name) {
        case "Rent":
          amountRupees = randomInt(25000, 30000);
          break;
        case "Education":
          amountRupees = randomInt(3000, 15000);
          break;
        case "Insurance":
          amountRupees = randomInt(2000, 12000);
          break;
        case "Electronics":
          amountRupees = randomInt(1500, 20000);
          break;
        case "Domestic Help":
          amountRupees = randomInt(3000, 8000);
          break;
        case "Groceries":
          amountRupees = randomInt(800, 4500);
          break;
        default:
          amountRupees = randomInt(150, 3500);
      }

      // Credit card used more often for larger/discretionary purchases.
      let paymentMethod: PaymentMethod;
      if (["Electronics", "Shopping", "Travel"].includes(category.name) && Math.random() > 0.4) {
        paymentMethod = "CREDIT_CARD";
      } else if (category.name === "Rent") {
        paymentMethod = "BANK_TRANSFER";
      } else {
        paymentMethod = pick(PAYMENT_METHODS.filter((m) => m !== "CREDIT_CARD" || Math.random() > 0.85));
      }

      await prisma.expense.create({
        data: {
          amountPaise: amountRupees * 100,
          date,
          userId: user.id,
          categoryId: category.id,
          description: pick(descriptionsForCategory),
          paymentMethod,
        },
      });
      expenseCount++;
    }
  }

  console.log(`Seeded ${users.length} users, ${categories.length} categories, ${months.length} months of income, ${expenseCount} expenses.`);
  console.log("\nTemporary login passwords (each member should change theirs after first login):");
  for (const c of credentials) {
    console.log(`  ${c.name.padEnd(14)} ${c.password}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
