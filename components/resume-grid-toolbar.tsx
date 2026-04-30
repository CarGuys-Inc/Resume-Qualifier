import { Input } from "@/components/ui/input";

type ResumeGridToolbarProps = {
  search: string;
  setSearch: (value: string) => void;
  searchType: "candidate_name" | "job_title";
  setSearchType: (value: "candidate_name" | "job_title") => void;
  qualifiedFilter: "all" | "qualified" | "not_qualified";
  setQualifiedFilter: (value: "all" | "qualified" | "not_qualified") => void;
  dateSort: "newest" | "oldest";
  setDateSort: (value: "newest" | "oldest") => void;
  scoreSort: "none" | "highest" | "lowest";
  setScoreSort: (value: "none" | "highest" | "lowest") => void;
  resetPage: () => void;
};
export default function ResumeGridToolbar({
    search,
    setSearch,
    searchType,
    setSearchType,
    qualifiedFilter,    
    setQualifiedFilter,
    dateSort,
    setDateSort,
    scoreSort,
    setScoreSort,
    resetPage
}: ResumeGridToolbarProps) {
   return (
    <div className="grid grid-cols-1 gap-3 mb-4 lg:grid-cols-[1fr_auto_auto_auto]">
        {/* Search with select inside */}
      <div className="flex w-full items-center rounded border bg-white overflow-hidden">
        <select
          value={searchType}
          onChange={(e) => {
            resetPage();
            setSearchType(e.target.value as "candidate_name" | "job_title");
          }}
          className="w-auto shrink-0 border-r text-sm px-3 py-2 outline-none"
        >
          <option value="candidate_name">Candidate</option>
          <option value="job_title">Job Title</option>
        </select>

        <Input
          type="text"
          placeholder={
            searchType === "candidate_name"
              ? "Search by candidate name..."
              : "Search by job title..."
          }
          value={search}
          onChange={(e) => {
            resetPage();
            setSearch(e.target.value);
          }}
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      <select
        value={qualifiedFilter}
        onChange={(e) => {
          resetPage();
          setQualifiedFilter(
            e.target.value as "all" | "qualified" | "not_qualified",
          );
        }}
        className="w-fit justify-self-start lg:justify-self-end border rounded px-3 py-2"
      >
        <option value="all">All Results</option>
        <option value="qualified">Qualified</option>
        <option value="not_qualified">Not Qualified</option>
      </select>

      <select
        value={dateSort}
        onChange={(e) => {
          resetPage();
          setDateSort(e.target.value as "newest" | "oldest");
        }}
        className="w-fit justify-self-start lg:justify-self-end border rounded px-3 py-2"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      <select
        value={scoreSort}
        onChange={(e) => {
          resetPage();
          setScoreSort(e.target.value as "none" | "highest" | "lowest");
        }}
        className="w-fit justify-self-start lg:justify-self-end border rounded px-3 py-2"
      >
        <option value="highest">Highest Score</option>
        <option value="lowest">Lowest Score</option>
        <option value="none">No Score Sort</option>
      </select>
    </div>
  );
}
