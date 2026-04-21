import { openai } from "@workspace/integrations-openai-ai-server";

const MODEL = "gpt-5.2";

const ALLOWED_CATEGORIES = ["Food", "Travel", "Bills", "Shopping", "Others"] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

export async function categorizeDescription(description: string): Promise<Category> {
  const trimmed = description.trim();
  if (!trimmed) return "Others";

  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content:
          "You categorize personal finance transactions. Reply with EXACTLY one word from this list: Food, Travel, Bills, Shopping, Others. No punctuation, no explanation.",
      },
      { role: "user", content: trimmed },
    ],
  });

  const raw = completion.choices[0]?.message?.content?.trim() ?? "Others";
  const match = ALLOWED_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  return match ?? "Others";
}

export interface InsightInput {
  currency: string;
  monthlyTotals: { month: string; income: number; expense: number }[];
  categoryTotals: { category: string; amount: number }[];
  recentTransactions: { date: string; category: string; amount: number; description: string }[];
}

export interface InsightResult {
  summary: string;
  suggestions: string[];
  predictedNextMonth: string | null;
}

export async function generateInsights(input: InsightInput): Promise<InsightResult> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    max_completion_tokens: 8192,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a personal finance assistant. Analyze the user's spending data and respond ONLY with a JSON object of shape: " +
          '{"summary": string, "suggestions": string[3-5 items], "predictedNextMonth": string}. ' +
          "Amounts in the input are in cents. Be concrete, friendly, and reference real numbers from the data.",
      },
      { role: "user", content: JSON.stringify(input) },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      suggestions: Array.isArray(parsed.suggestions)
        ? parsed.suggestions.filter((s: unknown): s is string => typeof s === "string")
        : [],
      predictedNextMonth:
        typeof parsed.predictedNextMonth === "string" ? parsed.predictedNextMonth : null,
    };
  } catch {
    return { summary: "", suggestions: [], predictedNextMonth: null };
  }
}
