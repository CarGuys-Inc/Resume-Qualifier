// components/resumes-processed-card.tsx

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

type ResumesProcessedCardProps = {
  resumesLabel: string;
  resumesCount: number;
  href?: string;
};

export default function ResumesProcessedCard({
  resumesLabel,
  resumesCount,
  href = "/dashboard/resumes",
}: ResumesProcessedCardProps) {
  return (
    <Card id="resumes-processed-card" className="h-full">
      <Link href={href}>
        <CardHeader>
          <CardTitle className="text-center">Resumes Processed</CardTitle>

          <CardDescription className="text-sm text-gray-500 text-center">
            <span className="resume-label-data">{resumesLabel}</span>

            <span className="resume-label-loading-bar hidden">
              <span className="resume-loading-fill" />
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex items-center text-5xl justify-center gap-2">
            <span className="resume-data">{resumesCount}</span>

            <span className="resume-count-loading-bar">
              <span className="resume-loading-fill" />
            </span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}