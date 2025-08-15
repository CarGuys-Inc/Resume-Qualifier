"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";

type Resume = {
  candidate_id?: string | number;
  candidate_name: string;
  job_title: string;
  score: number;
  qualified: boolean;
  reasoning: string;
  created_at: string;
  resume_text?: string;
  resumeFile?: string;
};

type ResumeCardProps = { resume: Resume };

export default function ResumeCard({ resume }: ResumeCardProps) {
  const scoreColor =
    resume.score >= 80
      ? "bg-green-100 text-green-700"
      : resume.score >= 50
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  const formattedTime = format(new Date(resume.created_at), "MMM dd | h:mm a");

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
  {/* Clickable area for the card */}
  <Link
    href={`https://recruiterflow.com/candidates/${resume.candidate_id}`}
    target="_blank"
    rel="noreferrer"
    className="block"
  >
    <CardHeader className="pb-2">
      <CardTitle className="flex justify-between items-center">
        <span className="text-lg font-semibold">{resume.candidate_name}</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${resume.qualified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {resume.qualified ? "Qualified" : "Not Qualified"}
        </span>
      </CardTitle>
      <p className="text-sm text-muted-foreground">{resume.job_title}</p>
    </CardHeader>

    <CardContent className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Score</span>
        <span className={`px-3 py-1 rounded-full font-semibold ${scoreColor}`}>{resume.score}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Processed</span>
        <span className="text-sm">{formattedTime}</span>
      </div>

      <div className="pt-2 border-t">
        <span className="block text-sm font-medium text-muted-foreground mb-1">Reasoning</span>
        <p className="text-sm leading-relaxed">{resume.reasoning}</p>
      </div>
    </CardContent>
  </Link>

  {/* Buttons remain outside the clickable area */}
  <div className="flex gap-2 p-4 pt-0">
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">View Resume Text</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resume.candidate_name} – Full Resume</DialogTitle>
        </DialogHeader>
        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{resume.resume_text}</pre>
      </DialogContent>
    </Dialog>

    {resume.resumeFile && (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">View Resume PDF</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-5xl sm:w-full w-80 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{resume.candidate_name} – Resume PDF</DialogTitle>
          </DialogHeader>
          <div className="w-full h-[80vh]">
            <iframe
              src={resume.resumeFile}
              className="w-full h-full"
              title={`${resume.candidate_name} Resume PDF`}
            />
          </div>
        </DialogContent>
      </Dialog>
    )}
  </div>
</Card>

  );
}
