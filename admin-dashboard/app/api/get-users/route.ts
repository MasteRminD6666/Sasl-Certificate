import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

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

    const totalUsers = await prisma.user.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}, // No filter when search is empty
    });

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}, // No filter when search is empty
      skip,
      take: limit,
      orderBy: { id: "desc" },
      select: {
        id: true,
        name: true,
        avatar: true,
        createdAt: true,
        email: true,
        role: true,
        verified: true,
        orders: true,
      },
    });

    const usersWithStatus = users.map((user) => ({
      ...user,
      status: "active",
    }));

    // const test = await axios.get(`https://api.appstoreconnect.apple.com/v1/apps/6670316380/salesReports`,{
    //   headers:{
    //     "Authorization": `Bearer 3TIG5DWJMYL6`
    //   }
    // })
    // console.log(test.data);

    // Calculate total pages
    const totalPages = Math.ceil(totalUsers / limit);

    // Construct the response with pagination metadata
    return NextResponse.json({
      data: usersWithStatus,
      meta: {
        totalUsers,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
