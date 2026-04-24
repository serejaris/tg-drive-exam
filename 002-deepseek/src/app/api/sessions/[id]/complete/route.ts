import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { db } from "@/lib/db";
import { quizSessions, questions, attempts } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

const PASS_THRESHOLD = 0.75;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionId = (await params).id;

    const session = await db.query.quizSessions.findFirst({
      where: and(eq(quizSessions.id, sessionId), eq(quizSessions.userId, userId)),
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Complete the session if not already completed
    if (session.status !== "completed") {
      await db
        .update(quizSessions)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(quizSessions.id, sessionId));
    }

    const percentage = session.total > 0 ? session.score / session.total : 0;
    const passed = percentage >= PASS_THRESHOLD;

    // Get wrong questions
    const sessionAttempts = await db.query.attempts.findMany({
      where: and(eq(attempts.sessionId, sessionId), eq(attempts.isCorrect, false)),
    });

    const wrongQuestionIds = sessionAttempts.map((a) => a.questionId);
    const wrongQuestionsData =
      wrongQuestionIds.length > 0
        ? await db.query.questions.findMany({
            where: inArray(questions.id, wrongQuestionIds),
          })
        : [];

    return NextResponse.json({
      data: {
        sessionId: session.id,
        mode: session.mode,
        score: session.score,
        total: session.total,
        percentage: Math.round(percentage * 100),
        passed,
        wrongQuestions: wrongQuestionsData.map((q) => ({
          id: q.id,
          questionEs: q.questionEs,
          questionRu: q.questionRu,
          explanationRu: q.explanationRu,
        })),
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to complete session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
