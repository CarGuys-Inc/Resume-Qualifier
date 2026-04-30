import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import DateRangeToolbar from "@/components/date-range-toolbar";
import ResumesProcessedCard from "@/components/resumes-processed-card";
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

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const params = await searchParams;
  const customStartDate = params?.start;
  const customEndDate = params?.end;
  const hasCustomDateRange = Boolean(customStartDate && customEndDate);
  const range = hasCustomDateRange ? "custom" : (params?.range ?? "today");

  const supabase = await createClient();

  const { data: claimsData, error: authError } =
    await supabase.auth.getClaims();
  if (authError || !claimsData?.claims) {
    redirect("/auth/login");
  }

  const { data: jobsData } = await supabase.from("job_configs").select();

  const now = new Date();

  let startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let endDate: Date | null = null;

  if (customStartDate && customEndDate) {
    startDate = new Date(`${customStartDate}T00:00:00`);
    endDate = new Date(`${customEndDate}T23:59:59`);
  } else if (range === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (range === "ytd") {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  let resumesCountQuery = supabase
    .from("resume_logs")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startDate.toISOString());

  if (endDate) {
    resumesCountQuery = resumesCountQuery.lte(
      "created_at",
      endDate.toISOString(),
    );
  }

  const { count: resumesCount } = await resumesCountQuery;
  
  if (!jobsData) return <div>No jobs found</div>;

  // Sort alphabetically by job_title
  const sortedJobs = [...jobsData].sort((a, b) =>
    a.job_title.localeCompare(b.job_title),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  let resumesLabel = "In the past 24 hours";

  if (customStartDate && customEndDate) {
    const formattedStartDate = formatDate(customStartDate);
    const formattedEndDate = formatDate(customEndDate);

    resumesLabel =
      formattedStartDate === formattedEndDate
        ? formattedStartDate
        : `${formattedStartDate} - ${formattedEndDate}`;
  } else if (range === "month") {
    resumesLabel = now.toLocaleString("en-US", { month: "long" });
  } else if (range === "ytd") {
    resumesLabel = "Year to date";
  }

  const resumesHrefParams = new URLSearchParams();

  if (customStartDate && customEndDate) {
    resumesHrefParams.set("start", customStartDate);
    resumesHrefParams.set("end", customEndDate);
  } else {
    resumesHrefParams.set("range", range);
  }

  const resumesHref = `/dashboard/resumes?${resumesHrefParams.toString()}`;

  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-4">Resume Processing</h1>
      <DateRangeToolbar
        activeRange={range}
        initialStartDate={customStartDate ?? ""}
        initialEndDate={customEndDate ?? ""}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-full mb-8">
        <Card className="h-full">
          <Link href="#">
            <CardHeader>
              <CardTitle className="text-center">
                Jobs Currently Qualifying
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-5xl justify-center gap-2">
                <span>{jobsData.length ?? 0}</span>
              </div>
            </CardContent>
          </Link>
        </Card>
        <ResumesProcessedCard
          resumesLabel={resumesLabel}
          resumesCount={resumesCount ?? 0}
          href={resumesHref}
        />
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
