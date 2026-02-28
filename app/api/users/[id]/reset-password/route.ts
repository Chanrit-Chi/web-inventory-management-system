import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requirePermission";
import { generatePassword } from "@/lib/password-generator";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requirePermission("user:update");

    const { id } = await params;

    // Generate a new random password
    const newPassword = generatePassword(12);

    // Get the user's email and current details
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        email: true,
        name: true,
        role: true,
        image: true,
        createdBy: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 1: Delete the existing credential account
    await prisma.account.deleteMany({
      where: {
        userId: id,
        providerId: "credential",
      },
    });

    // Step 2: Create new account with properly hashed password using better-auth's API
    // We'll create a temporary user, then move the account to the original user
    const tempEmail = `temp_${Date.now()}_${user.email}`;

    const tempUser = await auth.api.signUpEmail({
      body: {
        email: tempEmail,
        password: newPassword,
        name: user.name,
      },
    });

    if (!tempUser?.user?.id) {
      throw new Error("Failed to create temporary account");
    }

    // Step 3: Update the new account to point to the original user
    await prisma.account.updateMany({
      where: {
        userId: tempUser.user.id,
        providerId: "credential",
      },
      data: {
        userId: id,
      },
    });

    // Step 4: Delete the temporary user and their sessions
    await prisma.session.deleteMany({
      where: { userId: tempUser.user.id },
    });

    await prisma.user.delete({
      where: { id: tempUser.user.id },
    });

    return NextResponse.json({
      success: true,
      password: newPassword,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
