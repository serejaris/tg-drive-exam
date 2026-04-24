import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getUserId } from "@/lib/get-user-id";
import { db } from "@/lib/db";
import { users, questions, userQuestionStats, quizSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { shuffleArray } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const mode = body.mode as "practice" | "exam" | "mistakes";
    const limit = body.limit || (mode === "exam" ? user.examQuestionCount : 20);

    if (!["practice", "exam", "mistakes"].includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    let questionIds: string[];

    if (mode === "mistakes") {
      const allStats = await db.query.userQuestionStats.findMany({
        where: eq(userQuestionStats.userId, userId),
      });

      const weakIds = allStats
        .filter((s) => s.status === "weak" || s.status === "learning")
        .slice(0, limit)
        .map((s) => s.questionId);
      questionIds = weakIds;

      if (questionIds.length === 0) {
        questionIds = allStats
          .filter((s) => s.wrongCount > 0)
          .slice(0, limit)
          .map((s) => s.questionId);
      }
    } else {
      const allQuestions = await db.query.questions.findMany({
        columns: { id: true },
      });
      questionIds = shuffleArray(allQuestions.map((q) => q.id)).slice(0, limit);
    }

    if (questionIds.length === 0) {
      return NextResponse.json(
        { error: "No questions available for this mode" },
        { status: 400 }
      );
    }

    const sessionId = uuid();
    await db.insert(quizSessions).values({
      id: sessionId,
      userId,
      mode,
      questionIds,
      total: questionIds.length,
    });

    return NextResponse.json({
      data: { sessionId, total: questionIds.length },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to create session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
