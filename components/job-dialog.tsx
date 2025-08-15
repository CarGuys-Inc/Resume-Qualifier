"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

type Weight = {
  term: string;
  value: string | number;
};

type Job = {
  id?: number;
  job_title?: string;
  prompt_template?: string;
  weights?: Record<string, number>;
  acceptance_criteria?: string;
};

type JobDialogProps = {
  job?: Job;
  onSave?: () => void;
  triggerLabel?: string | null;
};

export default function JobDialog({
  job,
  onSave,
  triggerLabel = null
}: JobDialogProps) {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [weights, setWeights] = useState<Weight[]>([]);
  const [criteria, setCriteria] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  // Populate fields if editing
  useEffect(() => {
    if (job) {
      setJobTitle(job.job_title || "");
      setPrompt(job.prompt_template || "");
      setCriteria(job.acceptance_criteria || "");
      setWeights(
        job.weights
          ? Object.entries(job.weights).map(([term, value]) => ({ term, value }))
          : []
      );
    } else {
      setJobTitle("");
      setPrompt("");
      setCriteria("");
      setWeights([]);
    }
  }, [job, open]);

  const handleAddWeight = () => setWeights([...weights, { term: "", value: "" }]);

  const handleRemoveWeight = (index: number) =>
    setWeights(weights.filter((_, i) => i !== index));

const handleChangeWeight = (
  index: number,
  key: keyof Weight,
  value: string
) => {
  setWeights((prev) => {
    const updated = [...prev];

    if (key === "value") {
      updated[index][key] = Number(value); // convert to number
    } else {
      updated[index][key] = value; // keep as string
    }

    return updated;
  });
};

  const handleSave = async () => {
    setSaving(true);

    const weightsObj: Record<string, number> = weights.reduce(
      (acc, { term, value }) => {
        if (term.trim() !== "" && !isNaN(Number(value))) {
          acc[term.trim()] = Number(value);
        }
        return acc;
      },
      {}
    );

    let error;
    if (job?.id) {
      // Update existing job
      ({ error } = await supabase
        .from("job_configs")
        .update({
          job_title: jobTitle,
          prompt_template: prompt,
          weights: weightsObj,
          acceptance_criteria: criteria
        })
        .eq("id", job.id));
    } else {
      // Insert new job
      ({ error } = await supabase.from("job_configs").insert([
        {
          job_title: jobTitle,
          prompt_template: prompt,
          weights: weightsObj,
          acceptance_criteria: criteria
        }
      ]));
    }

    setSaving(false);

    if (error) {
      console.error("Error saving job:", error);
      return;
    }

    setOpen(false);
    onSave?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerLabel ? (
          <Button>{triggerLabel}</Button>
        ) : (
          <div className="mb-4 p-4 border rounded cursor-pointer dark:hover:bg-gray-600 hover:bg-gray-50">
            <h2 className="text-xl font-semibold">{job?.job_title}</h2>
          </div>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? `Edit ${job.job_title}` : "Create New Job"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <Input
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Automotive Mechanic"
            />
          </div>

          {/* Prompt Template */}
          <div>
            <label className="block text-sm font-medium mb-1">Prompt Template</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={20}
            />
          </div>

          {/* Weights Table */}
          <div>
            <label className="block text-sm font-medium mb-2">Weights</label>
            <div className="space-y-2">
              {weights.map((w, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="Term"
                    value={w.term}
                    onChange={(e) =>
                      handleChangeWeight(index, "term", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    type="number"
                    value={w.value}
                    onChange={(e) => handleChangeWeight(index, "value", e.target.value)}
                    className="w-28"
                    />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveWeight(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={handleAddWeight}>
                + Add Weight
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
