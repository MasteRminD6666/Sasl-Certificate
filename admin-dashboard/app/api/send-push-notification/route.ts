import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";

const EXPO_SERVER_URL = "https://exp.host/--/api/v2/push/send";

export async function POST(req: NextRequest) {
  try {
    const { title, message, data } = await req.json();

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required." },
        { status: 400 }
      );
    }

    const usersWithPushTokens = await prisma.user.findMany({
      where: {
        pushToken: {
          not: null,
        },
      },
      select: {
        pushToken: true,
      },
    });

    const pushTokens = usersWithPushTokens.map((user) => user.pushToken);

    const messages = pushTokens.map((token) => ({
      to: token,
      title,
      body: message,
      data,
      sound: "default",
      priority: "high",
    }));

    const response = await fetch(EXPO_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const responseData = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send notification", details: responseData },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
