"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  qualification_threshold?: number;
  auto_move_qualified?: boolean;
};

type JobDialogProps = {
  job?: Job;
  onSave?: () => void;
  triggerLabel?: string | null;
};

export default function JobDialog({
  job,
  onSave,
  triggerLabel = null,
}: JobDialogProps) {
  const [open, setOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [weights, setWeights] = useState<Weight[]>([]);
  const [qualificationThreshold, setQualificationThreshold] = useState(50); // default 50%
  const [saving, setSaving] = useState(false);
  const [autoMoveQualified, setAutoMoveQualified] = useState(false);

  const supabase = createClient();
  const router = useRouter();


useEffect(() => {
  if (job) {
    setAutoMoveQualified(job.auto_move_qualified ?? false);
  } else {
    setAutoMoveQualified(false);
  }
}, [job, open]);


  // Populate fields if editing
  useEffect(() => {
    if (job) {
      setJobTitle(job.job_title || "");
      setPrompt(job.prompt_template || "");
      setQualificationThreshold(job.qualification_threshold ?? 50);
      setWeights(
        job.weights
          ? Object.entries(job.weights).map(([term, value]) => ({
              term,
              value,
            }))
          : []
      );
    } else {
      setJobTitle("");
      setPrompt("");
      setQualificationThreshold(50);
      setWeights([]);
    }
  }, [job, open]);

  const handleAddWeight = () =>
    setWeights([...weights, { term: "", value: "" }]);

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

// Update handleSave to validate
const handleSave = async () => {
  if (!isTotalValid) {
    alert("The total of all weights must equal 100%");
    return;
  }

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
    ({ error } = await supabase
      .from("job_configs")
      .update({
        job_title: jobTitle,
        prompt_template: prompt,
        weights: weightsObj,
        qualification_threshold: qualificationThreshold,
        auto_move_qualified: autoMoveQualified,
      })
      .eq("id", job.id));
  } else {
    ({ error } = await supabase.from("job_configs").insert([
      {
        job_title: jobTitle,
        prompt_template: prompt,
        weights: weightsObj,
        qualification_threshold: qualificationThreshold,
        auto_move_qualified: autoMoveQualified,
      },
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

  const handleDelete = async () => {
    if (!job?.id) return;

    if (!confirm("Are you sure you want to delete this job?")) return;

    const { error } = await supabase
      .from("job_configs")
      .delete()
      .eq("id", job.id);

    if (error) {
      console.error("Error deleting job:", error);
      return;
    }

    setOpen(false);
    onSave?.(); // refresh the list
    router.refresh();
  };

  // Calculate total weight dynamically
const totalWeight = weights.reduce(
  (acc, w) => acc + (typeof w.value === "number" ? w.value : 0),
  0
);

// Check if total is valid
const isTotalValid = totalWeight === 100;



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

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? `Edit ${job.job_title}` : "Create New Job"}
          </DialogTitle>
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
            <label className="block text-sm font-medium mb-1">
              Prompt Template
            </label>
            <p>
              You are an AI recruiter assistant. You will score resumes against
              job descriptions.
            </p>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
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
                    onChange={(e) =>
                      handleChangeWeight(index, "value", e.target.value)
                    }
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
              <div className="mt-2 text-sm text-right font-medium pr-24">
                Total: {totalWeight}%
                {!isTotalValid && (
                  <span className="text-red-500 ml-2">Must equal 100%</span>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddWeight}>
                + Add Weight
              </Button>
            </div>

          </div>

          {/* Qualification Threshold */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Qualification Threshold
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Set the minimum score a resume must achieve to be considered
              qualified.
            </p>
            <div className="flex items-center gap-4">
              <Slider
                value={[qualificationThreshold]}
                max={100}
                step={1}
                className="flex-1"
                onValueChange={(value) => setQualificationThreshold(value[0])}
              />
              <span className="w-12 text-right font-medium">
                {qualificationThreshold}%
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Switch
                checked={autoMoveQualified}
                onCheckedChange={(checked) => setAutoMoveQualified(checked as boolean)}
              />
              <span>Sort to GPT Qualified</span>
            </div>

            <div className="flex gap-2">
              {job?.id && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  Delete Job
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
