import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId") || "dev-provider-session-token";

    // Pull all listing rows for this provider sorted by newest first
    const events = await prisma.eventListing.findMany({
      where: { providerId: providerId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ events }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch provider listings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}