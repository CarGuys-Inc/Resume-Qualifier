import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import JobDialog from "@/components/job-dialog";
import Link from "next/link";

export default async function JobsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  const { data: jobs } = await supabase.from('job_configs').select()
  const { data: resumes } = await supabase.from('resume_logs').select()

  if (!jobs) return <div>No jobs found</div>;

  // Sort alphabetically by job_title
  const sortedJobs = [...jobs].sort((a, b) =>
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
            <div className="flex items-center text-5xl justify-center text-center gap-2">
              <span>{jobs?.length ?? 0}</span>
            </div>
          </CardContent>
          </Link>
        </Card>
        <Card className="mb-6">
          <Link href="/resumes">
          <CardHeader>
            <CardTitle className="text-center">Resumes Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-5xl justify-center text-center gap-2">
              <span>{resumes?.length ?? 0}</span>
            </div>
          </CardContent>
          </Link>
        </Card>
      </div>

      {/* Job list */}
      <div>
        <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Jobs</h1>
        <Link href="/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create New Job
        </Link>
      </div>
        {sortedJobs.map((job) => (
          <JobDialog key={job.id} job={job} />
        ))}
      </div>
    </div>
    </div>
  );
}
