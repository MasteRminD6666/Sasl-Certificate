import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  try {
    // Access params.slug properly from the context
    const { params } = context;

    // params.slug needs to be accessed explicitly
    const courseSlug = params.slug;

    // Fetch the course data from the database
    const course = await prisma.course.findFirst({
      where: {
        slug: courseSlug,
      },
      include: {
        courseData: {
          include: {
            links: true,
          },
        },
        reviews: true,
        benefits: true,
        prerequisites: true,
      },
    });
    // Return the course data
    return NextResponse.json({ course });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
