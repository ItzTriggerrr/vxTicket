import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto"; 

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // Server-side baseline schema validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields. Name, email, and password must be provided." },
        { status: 400 }
      );
    }

    // 1. Verify user uniqueness within PostgreSQL data rows
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email address is already registered." },
        { status: 409 }
      );
    }

    // 2. Hash plain text credentials securely via bcrypt salting
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Explicit ID assignment to satisfy explicit Prisma constraints
    const secureUserId = crypto.randomUUID();

    // 4. Record insertion loop execution
    const newUser = await prisma.user.create({
      data: {
        id: secureUserId, 
        email,
        name,
        password: hashedPassword,
        role: role || "CUSTOMER", 
      },
    });

    // Strip password strings from output objects for client web transit security
    const { password: _, ...safeUser } = newUser;

    return NextResponse.json(
      { message: "Account created successfully!", user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Critical Backend Registration Failure Logging:", error);
    return NextResponse.json(
      { error: "Internal server processing fault. Please try again later." },
      { status: 500 }
    );
  }
}