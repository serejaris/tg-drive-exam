import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { db } from "@/lib/db";
import { users, reminderSettings, quizSessions, userQuestionStats } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: { reminderSetting: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Active session
    const activeSession = await db.query.quizSessions.findFirst({
      where: and(eq(quizSessions.userId, userId), eq(quizSessions.status, "active")),
    });

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = await db.query.quizSessions.findMany({
      where: and(
        eq(quizSessions.userId, userId),
        eq(quizSessions.status, "completed"),
        sql`${quizSessions.completedAt} >= ${today.toISOString()}`,
      ),
    });

    const todayTotal = todaySessions
      .filter((s) => s.score > 0)
      .reduce((acc, s) => acc + s.score, 0);
    const todayQuestions = todaySessions
      .filter((s) => s.score > 0)
      .reduce((acc, s) => acc + s.total, 0);

    // Overall accuracy from stats table
    const stats = await db.query.userQuestionStats.findMany({
      where: eq(userQuestionStats.userId, userId),
    });
    const totalAttempts = stats.reduce((acc, s) => acc + s.attemptsCount, 0);
    const totalCorrect = stats.reduce((acc, s) => acc + s.correctCount, 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    return NextResponse.json({
      data: {
        id: user.id,
        telegramUserId: user.telegramUserId,
        firstName: user.firstName,
        languageMode: user.languageMode,
        timezone: user.timezone,
        examQuestionCount: user.examQuestionCount,
        reminder: user.reminderSetting
          ? {
              enabled: user.reminderSetting.enabled,
              timeLocal: user.reminderSetting.timeLocal,
              timezone: user.reminderSetting.timezone,
            }
          : null,
        stats: {
          todaySessions: todaySessions.length,
          todayCorrect: todayTotal,
          todayTotal: todayQuestions,
          accuracy,
        },
        activeSession: activeSession
          ? {
              sessionId: activeSession.id,
              mode: activeSession.mode,
              currentIndex: activeSession.currentIndex,
              total: activeSession.total,
            }
          : null,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    // Update user settings
    const userUpdates: Record<string, unknown> = {};
    if (body.languageMode !== undefined) userUpdates.languageMode = body.languageMode;
    if (body.timezone !== undefined) userUpdates.timezone = body.timezone;
    if (body.examQuestionCount !== undefined) userUpdates.examQuestionCount = body.examQuestionCount;

    if (Object.keys(userUpdates).length > 0) {
      await db.update(users).set(userUpdates).where(eq(users.id, userId));
    }

    // Update reminder settings
    if (body.reminder !== undefined) {
      const reminderUpdates: Record<string, unknown> = {};
      if (body.reminder.enabled !== undefined) reminderUpdates.enabled = body.reminder.enabled;
      if (body.reminder.timeLocal !== undefined) reminderUpdates.timeLocal = body.reminder.timeLocal;
      if (body.reminder.timezone !== undefined) reminderUpdates.timezone = body.reminder.timezone;

      if (Object.keys(reminderUpdates).length > 0) {
        await db
          .update(reminderSettings)
          .set(reminderUpdates)
          .where(eq(reminderSettings.userId, userId));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to update settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
