"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { createClient } from "@/lib/supabase/client";
import { basicPrompt } from "@/lib/prompts";
import { useRouter } from "next/navigation";

type Weight = {
  term: string;
  value: number;
};

export default function JobDialog() {
  const [jobTitle, setJobTitle] = useState("");
  const [prompt, setPrompt] = useState(basicPrompt);
  const [weights, setWeights] = useState<Weight[]>([{ term: "", value: 0 }]);
  const [qualificationThreshold, setQualificationThreshold] = useState(70); // default 70%
  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleAddWeight = () => {
    setWeights([...weights, { term: "", value: 0 }]);
  };

  const handleRemoveWeight = (index: number) => {
    setWeights(weights.filter((_, i) => i !== index));
  };

  const handleChangeWeight = (index: number, key: keyof Weight, value: string | number) => {
    setWeights((prev) =>
      prev.map((w, i) =>
        i === index
          ? {
              ...w,
              [key]: key === "value" ? Number(value) : value,
            }
          : w
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const weightsObj = weights.reduce<Record<string, number>>((acc, { term, value }) => {
      if (term.trim() !== "" && !isNaN(value)) {
        acc[term.trim()] = Number(value);
      }
      return acc;
    }, {});

    const { error } = await supabase.from("job_configs").insert([
      {
        job_title: jobTitle,
        prompt_template: prompt,
        weights: weightsObj,
        qualification_threshold: qualificationThreshold,
      },
    ]);

    setSaving(false);

    if (error) {
      console.error("Error saving job:", error);
      return;
    }

    router.push("/dashboard");
  };

  return (
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
            <div key={index} className="flex gap-2 items-center">
              <Input
                placeholder="Term"
                value={w.term}
                onChange={(e) => handleChangeWeight(index, "term", e.target.value)}
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

      {/* Qualification Threshold */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Acceptance Criteria (Qualification Threshold)
        </label>
        <div className="flex items-center gap-4">
          <Slider
            value={[qualificationThreshold]}
            onValueChange={(val) => setQualificationThreshold(val[0])}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="w-12 text-sm text-muted-foreground text-right">
            {qualificationThreshold}%
          </span>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Job"}
      </Button>
    </div>
  );
}
