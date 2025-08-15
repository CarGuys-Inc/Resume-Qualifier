import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ResumeCard({ resume }) {
  const scoreColor =
    resume.score >= 80
      ? "bg-green-100 text-green-700"
      : resume.score >= 50
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <Link
        href={`https://recruiterflow.com/candidates/${resume.candidate_id}`}
        target="_blank"
        rel="noreferrer"
        className="block"
      >
        <CardHeader className="pb-2">
          <CardTitle className="flex justify-between items-center">
            <span className="text-lg font-semibold">{resume.candidate_name}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                resume.qualified
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {resume.qualified ? "Qualified" : "Not Qualified"}
            </span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{resume.job_title}</p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Score</span>
            <span className={`px-3 py-1 rounded-full font-semibold ${scoreColor}`}>
              {resume.score}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Processed</span>
            <span className="text-sm">
              {format(new Date(resume.created_at), "MMM dd | HH:mm")}
            </span>
          </div>

          <div className="pt-2 border-t">
            <span className="block text-sm font-medium text-muted-foreground mb-1">
              Reasoning
            </span>
            <p className="text-sm leading-relaxed">{resume.reasoning}</p>
          </div>
        </CardContent>
      </Link>

      {/* View Resume Button + Dialog */}
      <div className="p-4 pt-0">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">View Resume</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{resume.candidate_name} – Full Resume</DialogTitle>
            </DialogHeader>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {resume.resume_text}
            </pre>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
}
