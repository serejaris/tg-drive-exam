import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getUserId(req: NextRequest): string | null {
  return req.cookies.get("session")?.value ?? null;
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reminderSetting: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySessions = await prisma.quizSession.count({
    where: {
      userId: user.id,
      status: "completed",
      completedAt: { gte: today, lt: tomorrow },
    },
  });

  const totalAttempts = await prisma.attempt.count({
    where: { userId: user.id },
  });

  const correctAttempts = await prisma.attempt.count({
    where: { userId: user.id, isCorrect: true },
  });

  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  return NextResponse.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      username: user.username,
      languageMode: user.languageMode,
      timezone: user.timezone,
      examQuestionCount: user.examQuestionCount,
    },
    reminder: user.reminderSetting ?? null,
    stats: {
      todaySessions,
      totalAttempts,
      accuracy,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const updateData: any = {};
  if (body.languageMode) updateData.languageMode = body.languageMode;
  if (body.timezone) updateData.timezone = body.timezone;
  if (typeof body.examQuestionCount === "number")
    updateData.examQuestionCount = body.examQuestionCount;

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  if (body.reminder !== undefined) {
    await prisma.reminderSetting.upsert({
      where: { userId: user.id },
      update: {
        enabled: body.reminder.enabled ?? true,
        timeLocal: body.reminder.timeLocal ?? "09:00",
        timezone: body.reminder.timezone ?? user.timezone,
      },
      create: {
        userId: user.id,
        enabled: body.reminder.enabled ?? true,
        timeLocal: body.reminder.timeLocal ?? "09:00",
        timezone: body.reminder.timezone ?? user.timezone,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
