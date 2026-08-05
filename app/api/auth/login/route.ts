import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." }, 
        { status: 400 }
      );
    }

    // 1. Find the user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Null-Password Validation Gating Check
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password." }, 
        { status: 401 }
      );
    }

    // 2. Verify the cryptographic passkey hash matches
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." }, 
        { status: 401 }
      );
    }

    // 3. Remove password from the returned object for security processing
    const { password: _, ...safeProfile } = user;

    return NextResponse.json(
      { message: "Authentication successful.", profile: safeProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login Route Error:", error);
    return NextResponse.json(
      { error: "Internal server error encountered during verification." }, 
      { status: 500 }
    );
  }
}