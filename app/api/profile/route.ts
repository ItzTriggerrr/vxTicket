import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, email, role } = body;

    // Convert the frontend role ("provider") to your Prisma Enum ("PROVIDER")
    const mappedRole = role === "provider" ? "PROVIDER" : "CUSTOMER";

    // 1. Create the base User
    const newUser = await prisma.user.create({
      data: {
        id,
        email,
        role: mappedRole,
      },
    });

    // 2. If they are a provider, create their extended ProviderProfile too!
    if (mappedRole === "PROVIDER") {
      await prisma.providerProfile.create({
        data: {
          userId: id,
          businessName: "My Business", // A placeholder they can change later in their settings
        }
      });
    }

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("Profile Creation Error:", error.message);
    return NextResponse.json({ success: false, error: "Failed to create profile." }, { status: 500 });
  }
}