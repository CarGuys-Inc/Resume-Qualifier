import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResumesPieChart } from "@/components/job-pie-chart";
import ResumesGrid from "@/components/resumes-grid"; // new client component

export default async function ResumesPage() {
  const supabase = await createClient();

  // --- Auth check ---
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  // --- Stats (global, unaffected by search) ---
  const { count: totalCountResumes } = await supabase
    .from("resume_logs")
    .select("*", { count: "exact", head: true });

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: past24hResumes } = await supabase
    .from("resume_logs")
    .select()
    .gte("created_at", yesterday);

  const { data: allResumesForChart } = await supabase
    .from("resume_logs")
    .select()
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-4">Resumes Processed</h1>

      {/* Summary & chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Left column: two stacked cards */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Total Resumes Processed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-5xl justify-center">
                <span>{totalCountResumes ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">Resumes Processed</CardTitle>
              <CardDescription className="text-sm text-gray-500 text-center">
                Past 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-5xl justify-center">
                <span>{past24hResumes?.length ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: pie chart */}
        <div className="md:col-span-1 lg:col-span-2">
          <ResumesPieChart resumes={allResumesForChart ?? []} />
        </div>
      </div>

      {/* Resumes grid with search + pagination */}
      <ResumesGrid
        initialResumes={[]}
        totalCount={totalCountResumes ?? 0}
      />
    </div>
  );
}
