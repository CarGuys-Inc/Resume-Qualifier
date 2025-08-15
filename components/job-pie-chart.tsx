"use client"

import { Pie, PieChart, Cell } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart"

type Resume = {
  job_title: string
}

type ResumesPieChartProps = {
  resumes: Resume[]
}

export function ResumesPieChart({ resumes }: ResumesPieChartProps) {
  // Count resumes per job_title
  const counts: Record<string, number> = {}
  resumes.forEach((r) => {
    if (r.job_title) counts[r.job_title] = (counts[r.job_title] || 0) + 1
  })

  const chartData = Object.entries(counts).map(([name, value], idx) => ({
    name,
    value,
    fill: `var(--chart-${(idx % 5) + 1})`, // reuse your chart-1..5 colors
  }))

  // Create chartConfig for tooltip labels
  const chartConfig = Object.fromEntries(
    Object.keys(counts).map((jobTitle, idx) => [
      jobTitle,
      { label: jobTitle + " ", color: `var(--chart-${(idx % 5) + 1})` },
    ])
  ) as ChartConfig

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Resumes by Job</CardTitle>
        <CardDescription>Current processing totals</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <ChartTooltip
                cursor={false}
                content={
                    <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => `${name} ${value}`} // add a space here
                    />
                }
                />
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="text-muted-foreground leading-none">
          Showing current resumes grouped by job title
        </div>
      </CardFooter>
    </Card>
  )
}
