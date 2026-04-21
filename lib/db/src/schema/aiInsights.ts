import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";

export const aiInsightsTable = pgTable("ai_insights", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  summary: text("summary").notNull(),
  suggestions: jsonb("suggestions").$type<string[]>().notNull().default([]),
  predictedNextMonth: text("predicted_next_month"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AiInsight = typeof aiInsightsTable.$inferSelect;
