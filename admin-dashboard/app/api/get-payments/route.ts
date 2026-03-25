import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pageParam = searchParams.get("page");
    const search = searchParams.get("search") || "";
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = 20;

    // Validate page number
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        {
          error: "Invalid page number. Page number must be a positive integer.",
        },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    // Fetch total count of orders
    const totalOrders = await prisma.orders.count({
      where: {
        AND: [
          { course: { price: { gt: 0 } } },
          search
            ? {
                OR: [
                  { user: { name: { contains: search, mode: "insensitive" } } },
                  {
                    user: { email: { contains: search, mode: "insensitive" } },
                  },
                  {
                    course: { name: { contains: search, mode: "insensitive" } },
                  },
                ],
              }
            : {},
        ],
      },
    });

    // Fetch orders data
    const orders = await prisma.orders.findMany({
      where: {
        AND: [
          { course: { price: { gt: 0 } } },
          search
            ? {
                OR: [
                  { user: { name: { contains: search, mode: "insensitive" } } },
                  {
                    user: { email: { contains: search, mode: "insensitive" } },
                  },
                  {
                    course: { name: { contains: search, mode: "insensitive" } },
                  },
                ],
              }
            : {},
        ],
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            name: true,
            price: true,
          },
        },
      },
    });

    // Format orders for the response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      courseTitle: order.course.name,
      price: order.course.price,
      userName: order.user.name,
      userEmail: order.user.email,
      orderedAt: order.createdAt,
    }));

    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);

    // Construct the response
    return NextResponse.json({
      data: formattedOrders,
      meta: {
        totalOrders,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error.message);
    return NextResponse.json(
      { error: `Internal Server Error: ${error.message}` },
      { status: 500 }
    );
  }
}
