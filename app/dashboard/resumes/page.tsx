import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResumeCard from "@/components/resume-card"; 
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

        {/* {resumes.map((resume) => (
          <h2 key={resume.id} className="mb-4 p-4 border rounded-lg flex flex-col gap-2 shadow-sm">
            <p><strong>Name:</strong> {resume.candidate_name}</p>
            <p><strong>Job Applied For:</strong> {resume.job_title}</p>
            <p><strong>Score:</strong> {resume.score}</p>
            <p className="capitalize"><strong>Qualified:</strong> {resume.qualified.toLocaleString()}</p>
            <p><strong>Processed At:</strong> {new Date(resume.created_at).toLocaleString()}</p>
            <p><strong>Reasoning:</strong> {resume.reasoning.toLocaleString()}</p>
          </h2>
        ))} */}
      </div>
    </div>
    </div>
  );
}
