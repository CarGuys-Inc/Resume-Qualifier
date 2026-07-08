"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
  variants?: string[];
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
  const [variants, setVariants] = useState<string[]>([]);
  const [qualificationThreshold, setQualificationThreshold] = useState(50); // default 50%
  const [saving, setSaving] = useState(false);
  const [autoMoveQualified, setAutoMoveQualified] = useState(
    job?.auto_move_qualified ?? false,
  );
  const [toggleSaveStatus, setToggleSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

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
          : [],
      );
      setVariants(job.variants ?? []);
    } else {
      setJobTitle("");
      setPrompt("");
      setQualificationThreshold(50);
      setWeights([]);
      setVariants([]);
    }
    setSaveMessage(null);
  }, [job, open]);

  useEffect(() => {
    setAutoMoveQualified(job?.auto_move_qualified ?? false);
  }, [job?.auto_move_qualified]);

  const handleAddWeight = () =>
    setWeights([...weights, { term: "", value: "" }]);

  const handleRemoveWeight = (index: number) =>
    setWeights(weights.filter((_, i) => i !== index));

  const handleChangeWeight = (
    index: number,
    key: keyof Weight,
    value: string,
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

  const handleAddVariant = () => setVariants([...variants, ""]);

  const handleRemoveVariant = (index: number) =>
    setVariants(variants.filter((_, i) => i !== index));

  const handleChangeVariant = (index: number, value: string) =>
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });

  // Returns a validation message for a variant, or null if it's valid
  const getVariantError = (index: number, value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return null;

    if (trimmed === jobTitle.trim().toLowerCase()) {
      return "Same as job title";
    }

    const isDuplicate = variants.some(
      (v, i) => i !== index && v.trim().toLowerCase() === trimmed,
    );
    if (isDuplicate) return "Already added";

    return null;
  };

  const hasVariantErrors = variants.some(
    (v, i) => getVariantError(i, v) !== null,
  );

  // Update handleSave to validate
  const handleSave = async () => {
    if (!isTotalValid) {
      alert("The total of all weights must equal 100%");
      return;
    }

    if (hasVariantErrors) {
      alert("Please resolve the variant errors before saving.");
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    const cleanedVariants = variants
      .map((v) => v.trim())
      .filter((v) => v !== "");

    const weightsObj: Record<string, number> = weights.reduce(
      (acc, { term, value }) => {
        if (term.trim() !== "" && !isNaN(Number(value))) {
          acc[term.trim()] = Number(value);
        }
        return acc;
      },
      {},
    );

    try {
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
            variants: cleanedVariants,
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
            variants: cleanedVariants,
          },
        ]));
      }

      if (error) {
        console.error("Error saving job:", error);
        setSaveMessage({
          type: "error",
          text: error.message || "Failed to save. Please try again.",
        });
        return;
      }

      setSaveMessage({ type: "success", text: "Changes saved successfully." });
      onSave?.();
    } catch (err) {
      console.error("Error saving job:", err);
      setSaveMessage({
        type: "error",
        text: "Failed to save. Please try again.",
      });
    } finally {
      setSaving(false);
    }
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
    0,
  );

  // Check if total is valid
  const isTotalValid = totalWeight === 100;

  const handleAutoMoveToggle = async (checked: boolean) => {
    setAutoMoveQualified(checked);

    if(!job?.id) {
      return;
    }
    
    setToggleSaveStatus("saving");

    const { error } = await supabase
      .from("job_configs")
      .update({ auto_move_qualified: checked })
      .eq("id", job.id);

    if (error) {
      setToggleSaveStatus("error");
      return;
    }

    setToggleSaveStatus("saved");

    setTimeout(() => {
      setToggleSaveStatus("idle");
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerLabel ? (
          <Button>{triggerLabel}</Button>
        ) : (
          <div className="mb-4 p-4 border rounded cursor-pointer dark:hover:bg-gray-600 hover:bg-gray-50">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{job?.job_title}</h2>

              <div
                className="relative flex items-center group"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Switch
                  checked={autoMoveQualified}
                  onCheckedChange={(checked) =>
                    handleAutoMoveToggle(checked as boolean)
                  }
                />

                <span className="pointer-events-none absolute right-0 bottom-full mb-2 hidden whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block z-50">
                  Sort to GPT Qualified
                </span>

                {toggleSaveStatus !== "idle" && (
                  <div
                    className={`absolute left-full top-1/2 ml-3 -translate-y-1/2 rounded px-2 py-1 text-xs shadow-sm transition-all duration-300 whitespace-nowrap ${
                      toggleSaveStatus === "saving"
                        ? "bg-blue-50 text-blue-700"
                        : toggleSaveStatus === "saved"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    {toggleSaveStatus === "saving" && "Saving..."}
                    {toggleSaveStatus === "saved" && "Saved"}
                    {toggleSaveStatus === "error" && "Save failed"}
                  </div>
                )}
              </div>
            </div>
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
              disabled={saving}
            />
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Variants
            </label>
            <div className="space-y-2">
              {variants.map((variant, index) => {
                const variantError = getVariantError(index, variant);
                return (
                  <div key={index}>
                    <div className="flex gap-2">
                      <Input
                        value={variant}
                        onChange={(e) =>
                          handleChangeVariant(index, e.target.value)
                        }
                        placeholder="e.g. Quick Lube Tech"
                        className="flex-1"
                        disabled={saving}
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveVariant(index)}
                        disabled={saving}
                      >
                        x
                      </Button>
                    </div>
                    {variantError && (
                      <p className="text-red-500 text-xs mt-1">
                        {variantError}
                      </p>
                    )}
                  </div>
                );
              })}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddVariant}
                disabled={saving}
              >
                + Add Variant
              </Button>
            </div>
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
              disabled={saving}
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
                    disabled={saving}
                  />
                  <Input
                    placeholder="Value"
                    type="number"
                    value={w.value}
                    onChange={(e) =>
                      handleChangeWeight(index, "value", e.target.value)
                    }
                    className="w-28"
                    disabled={saving}
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveWeight(index)}
                    disabled={saving}
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
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddWeight}
                disabled={saving}
              >
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
                disabled={saving}
              />
              <span className="w-12 text-right font-medium">
                {qualificationThreshold}%
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-col gap-2 w-full">
            {saveMessage && (
              <p
                className={`text-sm ${
                  saveMessage.type === "success"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {saveMessage.text}
              </p>
            )}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoMoveQualified}
                  onCheckedChange={(checked) =>
                    setAutoMoveQualified(checked as boolean)
                  }
                  disabled={saving}
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
                  {saving && <Loader2 className="animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
