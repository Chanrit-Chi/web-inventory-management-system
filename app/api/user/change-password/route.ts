import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/getServerSession";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = PasswordChangeSchema.parse(body);
    const userId = session.user.id;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 1: Verify current password by attempting to sign in
    const signInResult = await auth.api.signInEmail({
      body: {
        email: user.email,
        password: validatedData.currentPassword,
      },
    });

    if (!signInResult?.user) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    // Step 2: Delete the existing credential account
    await prisma.account.deleteMany({
      where: {
        userId: userId,
        providerId: "credential",
      },
    });

    // Step 3: Create new account with properly hashed password using better-auth's API
    // We'll create a temporary user, then move the account to the original user
    const tempEmail = `temp_${Date.now()}_${user.email}`;

    const tempUser = await auth.api.signUpEmail({
      body: {
        email: tempEmail,
        password: validatedData.newPassword,
        name: user.name,
      },
    });

    if (!tempUser?.user?.id) {
      throw new Error("Failed to create temporary account");
    }

    // Step 4: Update the new account to point to the original user
    await prisma.account.updateMany({
      where: {
        userId: tempUser.user.id,
        providerId: "credential",
      },
      data: {
        userId: userId,
      },
    });

    // Step 5: Delete the temporary user and their sessions
    await prisma.session.deleteMany({
      where: { userId: tempUser.user.id },
    });

    await prisma.user.delete({
      where: { id: tempUser.user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 },
    );
  }
}
