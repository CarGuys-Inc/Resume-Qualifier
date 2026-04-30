"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import ResumeCard from "@/components/resume-card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import debounce from "lodash.debounce";

const PAGE_SIZE = 24;

export default function ResumesGrid({
  totalCount,
  startDate,
  endDate,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  totalCount: number;
  startDate: string;
  endDate: string | null;
}) {
  const supabase = createClient();

  const [resumes, setResumes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [searchType, setSearchType] = useState<"candidate_name" | "job_title">(
    "job_title",
  );

  const [qualifiedFilter, setQualifiedFilter] = useState<
    "all" | "qualified" | "not_qualified"
  >("all");

  const [dateSort, setDateSort] = useState<"newest" | "oldest">("newest");

  const [scoreSort, setScoreSort] = useState<"none" | "highest" | "lowest">(
    "highest",
  );

  const [totalPages, setTotalPages] = useState(
    Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE)),
  );

  // Debounced search
  const fetchResumes = async (searchTerm: string, pageNumber: number) => {
    let query = supabase
      .from("resume_logs")
      .select("*", { count: "exact" })
      .gte("created_at", startDate)
      .range((pageNumber - 1) * PAGE_SIZE, pageNumber * PAGE_SIZE - 1);

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    if (searchTerm) {
      query = query.ilike(searchType, `%${searchTerm}%`);
    }

    if (qualifiedFilter === "qualified") {
      query = query.eq("qualified", true);
    } else if (qualifiedFilter === "not_qualified") {
      query = query.eq("qualified", false);
    }

    query = query.order("created_at", {
      ascending: dateSort === "oldest",
    });

    if (scoreSort !== "none") {
      query = query.order("score", {
        ascending: scoreSort === "lowest",
      });
    }

    const { data, count, error } = await query;

    if (!error) {
      setResumes(data || []);
      setTotalPages(Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)));
    }
  };

  // Debounce search input so we don’t hit Supabase on every keystroke
  const debouncedFetch = useMemo(
  () =>
    debounce((searchTerm: string, pageNumber: number) => {
      fetchResumes(searchTerm, pageNumber);
    }, 300),
  [startDate, endDate, searchType, qualifiedFilter, dateSort, scoreSort],
);

useEffect(() => {
  debouncedFetch(search, page);

  return () => {
    debouncedFetch.cancel();
  };
}, [search, page, debouncedFetch]);

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
    <div>
      {/* Search */}
      <Input
        type="text"
        placeholder="Search by candidate name..."
        value={search}
        onChange={(e) => {
          setPage(1);
          setSearch(e.target.value);
        }}
        className="mb-4 p-2 border rounded w-full"
      />

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {resumes?.map((resume) => (
          <ResumeCard key={resume.id} resume={resume} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              {page > 1 && (
                <PaginationPrevious onClick={() => setPage(page - 1)} />
              )}
            </PaginationItem>

            {renderPaginationItems().map((p, idx) =>
              p === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    onClick={() => setPage(p as number)}
                    className={p === page ? "font-bold text-blue-600" : ""}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              {page < totalPages && (
                <PaginationNext onClick={() => setPage(page + 1)} />
              )}
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
