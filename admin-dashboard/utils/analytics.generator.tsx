"use server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface MonthData {
  month: string;
  count: number;
}

export async function generateLast12MonthsData(
  model: keyof PrismaClient
): Promise<{ last12Months: MonthData[] }> {
  const last12Months: MonthData[] = [];
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + 1);

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - i * 28
    );
    const startDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate() - 28
    );

    const monthYear = endDate.toLocaleString("default", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Add conditional logic for the `orders` model
    const whereClause =
      model === "orders"
        ? {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
            courseId: {
              not: "6491f481f8da881c1a0ddbc4", // Ignore orders with this courseId
            },
          }
        : {
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          };

    const count = await (prisma[model] as any).count({
      where: whereClause,
    });

    last12Months.push({ month: monthYear, count });
  }

  return { last12Months };
}
