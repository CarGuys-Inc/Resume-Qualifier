"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { basicPrompt } from "@/lib//prompts";
import { useRouter } from "next/navigation";

type Weight = {
  term: string;
  value: number;
};

export default function JobDialog() {
  const [jobTitle, setJobTitle] = useState("");
  const [prompt, setPrompt] = useState("");
const [weights, setWeights] = useState<Weight[]>([
  { term: "", value: 0 }
]);  const [saving, setSaving] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const handleAddWeight = () => {
    setWeights([...weights]);
  };

  const handleRemoveWeight = (index) => {
    setWeights(weights.filter((_, i) => i !== index));
  };

const handleChangeWeight = (index: number, key: keyof Weight, value: string | number) => {
  const updated = [...weights];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updated[index][key] = value as any; // or convert string->number if needed
  setWeights(updated);
};

  const handleSave = async () => {
    setSaving(true);

    const weightsObj = weights.reduce((acc, { term, value }) => {
      if (term.trim() !== "" && !isNaN(Number(value))) {
        acc[term.trim()] = Number(value);
      }
      return acc;
    }, {});

    let error;
      // Insert new job
      // eslint-disable-next-line prefer-const
      ({ error } = await supabase.from("job_configs").insert([
        {
          job_title: jobTitle,
          prompt_template: prompt,
          weights: weightsObj,
        }
      ]));

    setSaving(false);

    if (error) {
      console.error("Error saving job:", error);
      return;
    }

    router.push("/jobs")

  };


  return (
        <div className="">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Job Title</label>
            <Input
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Automotive Mechanic"
            />
          </div>

          {/* Prompt Template */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Prompt Template
            </label>
            <Textarea
              onChange={(e) => setPrompt(e.target.value)}
              defaultValue={basicPrompt}
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
                    onChange={(e) =>
                      handleChangeWeight(index, "term", e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Value"
                    type="number"
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
              <Button variant="secondary" size="sm" onClick={handleAddWeight}>
                + Add Weight
              </Button>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

  );
}
