import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DateRangeToolbar from "@/components/date-range-toolbar";
import ResumesProcessedCard from "@/components/resumes-processed-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ResumesPieChart } from "@/components/job-pie-chart";
import ResumesGrid from "@/components/resumes-grid"; // new client component

export default async function ResumesPage({
  searchParams,
}: {
  searchParams: Promise<{
    range?: string;
    start?: string;
    end?: string;
  }>;
}) {
  const supabase = await createClient();

  // --- Auth check ---
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  const params = await searchParams;

  const customStartDate = params?.start;
  const customEndDate = params?.end;

  const hasCustomDateRange = Boolean(customStartDate && customEndDate);
  const range = hasCustomDateRange ? "custom" : (params?.range ?? "today");

  const now = new Date();

  // --- Stats (global, unaffected by search) ---
  const { count: totalCountResumes } = await supabase
    .from("resume_logs")
    .select("*", { count: "exact", head: true });

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

  let resumesQuery = supabase
    .from("resume_logs")
    .select("*", { count: "exact" })
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false });

  if (endDate) {
    resumesQuery = resumesQuery.lte("created_at", endDate.toISOString());
  }

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

 const { data: filteredResumes, count: filteredResumesCount } =
  await resumesQuery;

  return (
    <div className="container mx-auto pb-10">
      <h1 className="text-3xl font-bold mb-4">Resumes Processed</h1>
      <DateRangeToolbar
        activeRange={range}
        initialStartDate={customStartDate ?? ""}
        initialEndDate={customEndDate ?? ""}
      />

      {/* Summary & chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-stretch">
        {/* Left column: two stacked cards */}
        <div className="grid grid-cols-1 gap-6 h-full">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-center">
                Total Resumes Processed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-5xl justify-center">
                <span>{totalCountResumes ?? 0}</span>
              </div>
            </CardContent>
          </Card>
          {/**TODO: add count result here */}
          <ResumesProcessedCard
            resumesLabel={resumesLabel}
            resumesCount={filteredResumesCount ?? 0}
            href="#"
          />
        </div>

        {/* Right column: pie chart */}
        <div className="md:col-span-1 lg:col-span-2 h-full">
          <ResumesPieChart resumes={filteredResumes ?? []} />
        </div>
      </div>

      {/* Resumes grid with search + pagination */}
      <ResumesGrid
        totalCount={filteredResumesCount ?? 0}
        startDate={startDate.toISOString()}
        endDate={endDate?.toISOString() ?? null}
      />
    </div>
  );
}
