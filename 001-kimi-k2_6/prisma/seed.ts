import { PrismaClient } from "@prisma/client";
import questions from "../data/questions.caba.b.starter40.es-ru.json";
import testRules from "../data/test_rules.es-ru.json";

const prisma = new PrismaClient();

async function main() {
  // Seed test rules as a singleton config record if needed
  console.log("Seeding", questions.length, "questions...");

  for (const q of questions as any[]) {
    const questionEs = q.question ?? q.question_es ?? "";
    const questionRu = q.question_ru ?? "";
    const options = (q.options ?? []) as any[];
    const media = q.media ?? null;

    await prisma.question.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        jurisdiction: q.jurisdiction ?? "CABA",
        licenseClass: (q.license_classes?.[0]) ?? "B",
        category: q.category ?? "general",
        questionEs,
        questionRu,
        type: mapType(q.type),
        correctOptionIds: q.correct_option_ids ?? [],
        media,
        explanationRu: q.explanation_ru ?? null,
        source: q.source ?? {},
        status: q.status ?? "manual_review_required",
        options: {
          create: options.map((opt: any, idx: number) => ({
            optionId: opt.id ?? String.fromCharCode(97 + idx),
            textEs: opt.text ?? opt.text_es ?? "",
            textRu: opt.text_ru ?? "",
            sortOrder: idx,
          })),
        },
      },
    });
  }

  console.log("Seeded successfully.");
}

function mapType(t: string) {
  if (t === "single_choice") return "single_choice";
  if (t === "multiple_choice") return "multiple_choice";
  if (t === "true_false") return "true_false";
  return "single_choice";
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
