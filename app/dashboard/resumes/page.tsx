import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import ResumeCard from "@/components/resume-card"; 
import { ResumesPieChart } from "@/components/job-pie-chart";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 24;

export default async function ResumesPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Number(searchParams?.page ?? 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  // Auth check
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/auth/login");

  // Fetch counts and data
  const { count: totalCountResumes } = await supabase.from("resume_logs").select("*", { count: "exact", head: true });
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: past24hResumes } = await supabase.from("resume_logs").select().gte("created_at", yesterday);
  const { data: pagedResumes } = await supabase.from("resume_logs").select().order("created_at", { ascending: false }).range(offset, offset + PAGE_SIZE - 1);
  const { data: allResumesForChart } = await supabase.from("resume_logs").select().order("created_at", { ascending: false });

  const totalPages = Math.ceil((totalCountResumes ?? 0) / PAGE_SIZE);

  // --- Helper to render pagination items with ellipsis ---
  const renderPaginationItems = () => {
    const items: (number | "ellipsis")[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p <= 2 || p > totalPages - 2 || Math.abs(p - page) <= 1) {
        items.push(p);
      } else if (items[items.length - 1] !== "ellipsis") {
        items.push("ellipsis");
      }
    }
    return items;
  };

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

      {/* Resumes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {pagedResumes?.map(resume => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {page > 1 && <PaginationPrevious href={`?page=${page - 1}`} />}
            </PaginationItem>

            {renderPaginationItems().map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href={`?page=${p}`}
                    className={p === page ? "font-bold text-blue-600" : ""}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}

            <PaginationItem>
              {page < totalPages && <PaginationNext href={`?page=${page + 1}`} />}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
