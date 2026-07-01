import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfjs = require("pdfjs-dist/legacy/build/pdf.mjs");

const MINIMUM_MATCH_SCORE = 85;

type JobConfig = {
  job_title: string;
  prompt_template: string | null;
  weights: Record<string, number> | null;
  qualification_threshold: number | null;
};

type AiMatch = {
  job_title: string;
  match_score: number;
  fit_level: string;
  reasoning: string | null;
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSameJobTitle(a: string, b: string) {
  return normalizeText(a) === normalizeText(b);
}

type PdfTextItem = { str: string };

async function parsePdf(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      (content.items as PdfTextItem[])
        .map((item) => ("str" in item ? item.str : ""))
        .join(" "),
    );
  }
  return pages.join("\n");
}

async function fetchResumeText(resumeUrl: string): Promise<string> {
  const res = await fetch(resumeUrl);
  if (!res.ok) throw new Error(`Failed to fetch resume: ${res.status}`);

  const buffer = await res.arrayBuffer();
  const url = resumeUrl.toLowerCase();
  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("pdf") || url.endsWith(".pdf")) {
    return parsePdf(buffer);
  }

  throw new Error("Only PDF resumes are supported by this test tool.");
}

function buildPrompt(resumeText: string, jobConfigs: JobConfig[], systemTemplate: string) {
  const jobs = jobConfigs.map((job, i) => ({
    index: i + 1,
    job_title: job.job_title,
    job_description: job.prompt_template ?? "",
    weights: job.weights ?? null,
    qualification_threshold: job.qualification_threshold ?? null,
  }));

  return `${systemTemplate}

JOBS:
${JSON.stringify(jobs, null, 2)}

RESUME:
${resumeText}`;
}

type RawMatch = {
  job_title?: unknown;
  match_score?: unknown;
  fit_level?: unknown;
  reasoning?: unknown;
};

function sanitizeMatches(
  raw: unknown,
  allowedTitles: Set<string>,
  appliedJobTitle: string | null,
): AiMatch[] {
  const parsed = raw as { matches?: RawMatch[] };
  const matches: RawMatch[] = Array.isArray(parsed?.matches) ? parsed.matches : [];

  return matches
    .filter((m) => {
      if (!m || typeof m.job_title !== "string") return false;
      if (!allowedTitles.has(m.job_title)) return false;
      if (appliedJobTitle && isSameJobTitle(m.job_title, appliedJobTitle)) return false;
      if (String(m.fit_level ?? "").toLowerCase().trim() !== "strong") return false;
      const score = typeof m.match_score === "number" ? m.match_score : Number(m.match_score);
      if (!Number.isFinite(score) || score < MINIMUM_MATCH_SCORE) return false;
      return true;
    })
    .map((m) => ({
      job_title: m.job_title as string,
      match_score: Number(m.match_score),
      fit_level: "strong",
      reasoning: typeof m.reasoning === "string" ? m.reasoning : null,
    }));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { resumeUrl, appliedJobTitle = null, systemTemplate } = body;

  if (!resumeUrl || typeof resumeUrl !== "string") {
    return NextResponse.json({ error: "resumeUrl is required" }, { status: 400 });
  }
  if (!systemTemplate || typeof systemTemplate !== "string") {
    return NextResponse.json({ error: "systemTemplate is required" }, { status: 400 });
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (!openAiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  // Parse resume
  let resumeText: string;
  try {
    resumeText = await fetchResumeText(resumeUrl.trim());
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Resume parse failed: ${err instanceof Error ? err.message : err}` },
      { status: 422 },
    );
  }

  // Fetch job configs from Supabase
  const supabase = await createClient();
  const { data: jobConfigs, error: dbError } = await supabase
    .from("job_configs")
    .select("job_title, prompt_template, weights, qualification_threshold");

  if (dbError || !jobConfigs) {
    return NextResponse.json({ error: "Failed to fetch job configs" }, { status: 500 });
  }

  const filteredConfigs = appliedJobTitle
    ? jobConfigs.filter((j) => !isSameJobTitle(j.job_title, appliedJobTitle))
    : jobConfigs;

  // Call OpenAI
  const prompt = buildPrompt(resumeText, filteredConfigs, systemTemplate.trim());

  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `OpenAI request failed: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  if (!aiResponse.ok) {
    const text = await aiResponse.text();
    return NextResponse.json(
      { error: `OpenAI error (${aiResponse.status}): ${text}` },
      { status: 502 },
    );
  }

  const aiJson = await aiResponse.json();
  const content: string = aiJson.choices?.[0]?.message?.content ?? "";

  let parsed: unknown;
  try {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    parsed = JSON.parse(start >= 0 && end > start ? content.slice(start, end + 1) : content);
  } catch {
    return NextResponse.json(
      { error: "OpenAI returned unparseable JSON", raw: content },
      { status: 502 },
    );
  }

  const allowedTitles = new Set(filteredConfigs.map((j) => j.job_title));
  const matchedJobTitles = sanitizeMatches(parsed, allowedTitles, appliedJobTitle);

  return NextResponse.json({ data: { appliedJobTitle, matchedJobTitles } });
}
