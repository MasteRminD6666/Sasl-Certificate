import { generateLast12MonthsData } from "@/utils/analytics.generator";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const model: any = searchParams.get("model");

    if (!model || !["orders", "user"].includes(model)) {
      return NextResponse.json(
        { error: "Invalid or missing model parameter" },
        { status: 400 }
      );
    }

    const data = await generateLast12MonthsData(model);

    return NextResponse.json({
      data,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
