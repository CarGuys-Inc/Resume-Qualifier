import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import JobDialog from "@/components/job-dialog";
import Link from "next/link";

// Define types for Supabase tables
// type JobConfig = {
//   id: number;
//   job_title: string;
//   prompt_template: string;
//   weights: Record<string, number>;
//   qualification_threshold?: number;
// };

// type ResumeLog = {
//   id: number;
//   candidate_name: string;
//   candidate_id?: number;
//   job_id?: number;
//   job_title: string;
//   score: number;
//   qualified: boolean;
//   reasoning: string;
//   resume_text?: string;
//   created_at: string;
// };

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: claimsData, error: authError } = await supabase.auth.getClaims();
  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const { data: jobsData } = await supabase.from("job_configs").select();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: resumesData } = await supabase
    .from("resume_logs")
    .select()
    .gte("created_at", yesterday.toISOString());

  if (!jobsData) return <div>No jobs found</div>;

  // Sort alphabetically by job_title
  const sortedJobs = [...jobsData].sort((a, b) =>
    a.job_title.localeCompare(b.job_title)
  );

  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-4">Resume Processing</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="mb-6">
          <Link href="#">
            <CardHeader>
              <CardTitle className="text-center">Jobs Currently Qualifying</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-5xl justify-center gap-2">
                <span>{jobsData.length ?? 0}</span>
              </div>
            </CardContent>
          </Link>
        </Card>
        <Card className="mb-6">
          <Link href="dashboard/resumes">
            <CardHeader>
              <CardTitle className="text-center">Resumes Processed</CardTitle>
              <CardDescription className="text-sm text-gray-500 text-center">
                In the past 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-5xl justify-center gap-2">
                <span>{resumesData?.length ?? 0}</span>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Job list */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Jobs</h1>
          <Link
            href="/dashboard/new"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create New Job
          </Link>
        </div>

        {sortedJobs.map((job) => (
          <JobDialog key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
