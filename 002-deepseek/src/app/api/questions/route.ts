import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-user-id";
import { db } from "@/lib/db";
import { users, questions, userQuestionStats } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { shuffleArray } from "@/lib/utils";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "practice";
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const langMode = user.languageMode;

    let questionIds: string[];

    if (mode === "mistakes") {
      // Get weak/learning questions or any with incorrect answers
      const allStats = await db.query.userQuestionStats.findMany({
        where: eq(userQuestionStats.userId, userId),
      });

      const weakIds = allStats
        .filter((s) => s.status === "weak" || s.status === "learning")
        .slice(0, limit)
        .map((s) => s.questionId);
      questionIds = weakIds;

      // Fallback: any wrong questions
      if (questionIds.length === 0) {
        questionIds = allStats
          .filter((s) => s.wrongCount > 0)
          .slice(0, limit)
          .map((s) => s.questionId);
      }
    } else {
      // Practice or exam: get all questions
      const allQuestions = await db.query.questions.findMany({
        columns: { id: true },
      });
      questionIds = shuffleArray(allQuestions.map((q) => q.id)).slice(0, limit);
    }

    if (questionIds.length === 0) {
      return NextResponse.json({ data: { questions: [], total: 0 } });
    }

    // Fetch questions with options
    const questionsData = await db.query.questions.findMany({
      where: inArray(questions.id, questionIds),
      with: { options: true },
    });

    // Sort according to the shuffled questionIds order
    const sorted = questionIds
      .map((id) => questionsData.find((q) => q.id === id))
      .filter(Boolean)
      .map((q) => ({
        id: q!.id,
        questionEs: langMode !== "ru_only" ? q!.questionEs : undefined,
        questionRu: langMode !== "es_only" ? q!.questionRu : undefined,
        media: q!.media,
        explanationRu: q!.explanationRu,
        options: shuffleArray(
          q!.options.map((o) => ({
            id: o.optionId,
            textEs: langMode !== "ru_only" ? o.textEs : undefined,
            textRu: langMode !== "es_only" ? o.textRu : undefined,
          }))
        ),
      }));

    return NextResponse.json({
      data: {
        questions: sorted,
        total: sorted.length,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to fetch questions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
