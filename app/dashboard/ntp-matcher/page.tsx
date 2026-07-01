"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "ntp_matcher_system_template";

const DEFAULT_TEMPLATE = `You are an expert automotive hiring specialist matching a resume to job titles.

STEP 1 — INDUSTRY CHECK
First, determine whether this resume shows any experience, exposure, or connection to the automotive/car business industry at all (dealerships, repair shops, auto parts, body shops, automotive sales, etc.).
If there is no automotive industry experience whatsoever and no job titles from the list below could reasonably be shortlisted, respond with ONLY this JSON and stop:
{ "matches": [{ "job_title": "Not in the Car Biz", "match_score": 100, "fit_level": "strong", "reasoning": "No automotive industry experience found in resume." }] }

STEP 2 — SHORTLIST
Read the resume. Identify which job titles from the list below could be a strong direct fit based on actual resume evidence — prior job titles, hands-on work personally performed, tools, certifications, or repeated relevant experience.
Do not shortlist based on transferable skills, adjacent experience, or industry alone.

STEP 3 — SCORE
For each shortlisted title, compare the resume against that job's description individually and score 0–100:
- 0: No real connection on closer inspection — shortlisting was a false positive
- 85–89: Strong but partial match
- 90–94: Strong direct match
- 95–100: Excellent, well-evidenced match
Only return titles scoring 85 or higher in the matches array.

If every shortlisted title scores exactly 0, respond with ONLY this JSON and stop:
{ "matches": [{ "job_title": "Not in the Car Biz", "match_score": 100, "fit_level": "strong", "reasoning": "Shortlisted titles did not hold up on closer comparison — no real connection to the car business." }] }

HANDS-ON ROLES — the applicant must have personally performed the work, not just scheduled, quoted, coordinated, or communicated about it:
- Quick Lube Tech: requires personal performance of oil changes, tire rotations, fluid checks, filter replacement, or express maintenance
- Automotive Mechanic / Technician: requires personal performance of diagnostics, repairs, inspections, or maintenance
- Parts Counter Help: requires personally looking up, selling, or handling parts inventory at a counter
- Any manager title: requires direct management, supervision, hiring/training, or department ownership
- Body Shop Painter: requires direct painting, refinishing, or collision repair work
- Body Shop Technician: requires direct body repair, frame, dent, or panel work
- Automotive Sales: requires direct sales, closing, CRM, or commission-based customer experience

Return valid JSON only. No markdown. No text outside JSON.
If no titles score 85+ and it's not a full "not in car biz" case, return an empty matches array.

{
  "matches": [
    {
      "job_title": "string",
      "match_score": integer,
      "fit_level": "strong",
      "reasoning": "Specific resume evidence that supports this match."
    }
  ]
}`;

type MatchResult = {
  job_title: string;
  match_score: number;
  fit_level: string;
  reasoning: string | null;
};

function ScoreBadge({ score }: { score: number }) {
  let className = "text-xs font-semibold tabular-nums ";
  if (score >= 90) className += "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  else if (score >= 85) className += "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  else className += "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  return <Badge className={className}>{score}</Badge>;
}

export default function NtpMatcherPage() {
  const [systemTemplate, setSystemTemplate] = useState(DEFAULT_TEMPLATE);
  const [savedTemplate, setSavedTemplate] = useState(DEFAULT_TEMPLATE);
  const [resumeUrl, setResumeUrl] = useState("");
  const [appliedJobTitle, setAppliedJobTitle] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSystemTemplate(stored);
      setSavedTemplate(stored);
    }
  }, []);

  const isDirty = systemTemplate !== savedTemplate;

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, systemTemplate);
    setSavedTemplate(systemTemplate);
  }

  function handleReset() {
    setSystemTemplate(DEFAULT_TEMPLATE);
    setSavedTemplate(DEFAULT_TEMPLATE);
    localStorage.removeItem(STORAGE_KEY);
  }

  function toggleRow(index: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleRunTest() {
    if (!resumeUrl.trim()) return;
    setRunning(true);
    setResults(null);
    setError(null);
    setExpandedRows(new Set());

    try {
      const res = await fetch("/api/ntp-matcher/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeUrl: resumeUrl.trim(),
          appliedJobTitle: appliedJobTitle.trim() || null,
          systemTemplate,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? "Unknown error from matcher service.");
        return;
      }

      const matches: MatchResult[] = json?.data?.matchedJobTitles ?? [];
      setResults(matches);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">NTP Matcher</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit the system prompt used to classify applicants into NTP buckets, and test it against any resume.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left — Prompt editor */}
        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              This is the instruction template sent to GPT before the job list and resume. The{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">JOBS</code> and{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">RESUME</code> sections are
              always appended automatically — do not include them here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={systemTemplate}
              onChange={(e) => setSystemTemplate(e.target.value)}
              rows={28}
              className="font-mono text-xs resize-y"
            />
            <div className="flex items-center gap-3">
              <Button onClick={handleSave} disabled={!isDirty}>
                {isDirty ? "Save Changes" : "Saved"}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Reset to Default
              </Button>
              {isDirty && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  Unsaved changes — test will use current editor content
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right — Test panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test</CardTitle>
              <CardDescription>
                Run the prompt against a resume and see which NTP buckets it matches.
                {isDirty && (
                  <span className="block mt-1 text-yellow-600 dark:text-yellow-400">
                    Unsaved changes in editor — save to lock them in.
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Resume URL</label>
                <Input
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Applied Job Title{" "}
                  <span className="text-muted-foreground font-normal">(optional — excluded from matching)</span>
                </label>
                <Input
                  value={appliedJobTitle}
                  onChange={(e) => setAppliedJobTitle(e.target.value)}
                  placeholder="e.g. Dealership Sales Manager"
                />
              </div>
              <Button
                onClick={handleRunTest}
                disabled={running || !resumeUrl.trim()}
                className="w-full"
              >
                {running ? "Running…" : "Run Test"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {error && (
            <Card className="border-red-300 dark:border-red-700">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </CardContent>
            </Card>
          )}

          {results !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {results.length === 0
                    ? "No job titles scored 85 or above."
                    : `${results.length} match${results.length === 1 ? "" : "es"} returned.`}
                </CardDescription>
              </CardHeader>
              {results.length > 0 && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50 text-left">
                          <th className="px-4 py-2 font-medium">Job Title</th>
                          <th className="px-4 py-2 font-medium w-20">Score</th>
                          <th className="px-4 py-2 font-medium w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((match, i) => (
                          <>
                            <tr
                              key={i}
                              className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                              onClick={() => toggleRow(i)}
                            >
                              <td className="px-4 py-3 font-medium">{match.job_title}</td>
                              <td className="px-4 py-3">
                                <ScoreBadge score={match.match_score} />
                              </td>
                              <td className="px-4 py-3 text-muted-foreground text-xs">
                                {expandedRows.has(i) ? "▲" : "▼"}
                              </td>
                            </tr>
                            {expandedRows.has(i) && match.reasoning && (
                              <tr key={`${i}-reasoning`} className="border-b last:border-0 bg-muted/20">
                                <td colSpan={3} className="px-4 py-3 text-xs text-muted-foreground">
                                  {match.reasoning}
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
