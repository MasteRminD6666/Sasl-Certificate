import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const courses = (await prisma.course.findMany()).toReversed();
    return NextResponse.json({
      data: courses,
    });
  } catch (error) {
    console.log(error);
  }
}
