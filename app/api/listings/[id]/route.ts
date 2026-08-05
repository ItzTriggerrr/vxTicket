import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assetId } = await params;

    // Pull directly out of PostgreSQL using Prisma's eventListing model
    const assetNode = await prisma.eventListing.findUnique({
      where: { id: assetId },
      include: {
        ticketTiers: true,
        lineup: true,
      },
    });

    if (!assetNode) {
      return NextResponse.json(
        { success: false, error: "Requested resource allocation reference not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: assetNode }, { status: 200 });

  } catch (error) {
    console.error("Server Pipeline Fetch Fail Overload Shield:", error);
    return NextResponse.json(
      { success: false, error: "Edge server pipeline delivery malfunction" },
      { status: 500 }
    );
  }
}