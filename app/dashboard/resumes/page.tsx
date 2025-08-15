import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResumeCard from "@/components/resume-card"; 
import { ResumesPieChart } from "@/components/job-pie-chart";
import Link from "next/link";

export default async function ResumesPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  const { data: resumes } = await supabase.from('resume_logs').select().order('created_at', { ascending: false });

  if (!resumes) return <div>No jobs found</div>;



  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-4">Resumes Processed</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
        <ResumesPieChart resumes={resumes ?? []} />

      </div>

      {/* Resumes list */}
      <div>
        <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Resumes</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {resumes.map(resume => (
    <ResumeCard key={resume.id} resume={resume} />
  ))}
</div>
      </div>
    </div>
    </div>
  );
}
