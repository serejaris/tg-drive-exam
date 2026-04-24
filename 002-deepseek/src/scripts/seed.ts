import { readFileSync } from "fs";
import { join } from "path";
import { v4 as uuid } from "uuid";
import { db } from "../lib/db";
import { questions, questionOptions } from "../lib/db/schema";

interface SourceQuestion {
  id: string;
  country: string;
  jurisdiction: string;
  license_classes: string[];
  category: string;
  question: string;
  question_ru: string;
  type: string;
  correct_option_ids: string[];
  options: { id: string; text: string; text_ru: string }[];
  media?: { type: string; url: string } | null;
  explanation_ru?: string;
  source: { title?: string; url?: string; retrieved_at?: string };
  status?: string;
  notes?: string;
  notes_ru?: string;
  tags?: string[];
}

async function seed() {
  const dataPath = join(__dirname, "..", "..", "data", "questions.caba.b.starter40.es-ru.json");
  const raw = readFileSync(dataPath, "utf-8");
  const questionsData: SourceQuestion[] = JSON.parse(raw);

  console.log(`Seeding ${questionsData.length} questions...`);

  for (let i = 0; i < questionsData.length; i++) {
    const q = questionsData[i];

    const media =
      q.media && q.media.url ? { type: q.media.type, url: q.media.url } : null;

    const source = {
      title: q.source?.title || "",
      url: q.source?.url || "",
      retrieved_at: q.source?.retrieved_at || new Date().toISOString(),
    };

    await db
      .insert(questions)
      .values({
        id: q.id,
        jurisdiction: q.jurisdiction,
        licenseClass: q.license_classes.join(","),
        category: q.category,
        questionEs: q.question,
        questionRu: q.question_ru,
        type: (q.type as "single_choice") || "single_choice",
        correctOptionIds: q.correct_option_ids,
        media,
        explanationRu: q.explanation_ru || null,
        source,
        status: q.status || "manual_review_required",
        updatedAt: new Date(),
      })
      .onConflictDoNothing();

    for (let j = 0; j < q.options.length; j++) {
      const opt = q.options[j];
      await db
        .insert(questionOptions)
        .values({
          id: uuid(),
          questionId: q.id,
          optionId: opt.id,
          textEs: opt.text,
          textRu: opt.text_ru,
          sortOrder: j,
        })
        .onConflictDoNothing();
    }

    if ((i + 1) % 10 === 0 || i === questionsData.length - 1) {
      console.log(`  Processed ${i + 1}/${questionsData.length} questions`);
    }
  }

  console.log("Seed complete.");
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
