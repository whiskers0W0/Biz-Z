import { replaceBusinessName } from "./businessName";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planSchema } from "./schemas/planSchema";
import type { PlanFormValues } from "./schemas/planSchema";
import type { Plan } from "./data";
import { api } from "./data";
import { Button, Modal, LoadingScreen } from "./components";
export function PlanSettings({
  plan,
  isDemo,
  onUpdate,
}: {
  plan: Plan;
  isDemo: boolean;
  onUpdate: (p: Plan) => void;
}) {
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: plan.name, description: plan.description },
  });
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          reset({ name: plan.name, description: plan.description });
          setOpen(true);
        }}
      >
        Edit business details
      </Button>
      {open && (
        <Modal title="Your business details" onClose={() => setOpen(false)}>
          {isSubmitting && <LoadingScreen label="Updating business details and drafts…" />}
          <p>Name changes keep your progress. Description changes need another review.</p>
          <form
            noValidate
            onSubmit={handleSubmit(async (v) => {
              try {
                if (isDemo && v.description !== plan.description && plan.sections.some(s=>s.draft.trim())) throw new Error("Sign in to update existing drafts with Zee. Your details have not changed.");
                onUpdate(
                  isDemo
                    ? { ...plan, ...v, sections: plan.sections.map(s => {
                      if (v.name === plan.name || !s.draft) return s;
                      const draft=replaceBusinessName(s.draft,plan.name,v.name);
                      const revisions=[...(s.revisions || [])];
                      if (!revisions.length) revisions.push({_id:crypto.randomUUID(),draft:s.draft,source:"Previous draft",createdAt:new Date().toISOString()});
                      if(draft!==s.draft) revisions.push({_id:crypto.randomUUID(),draft,source:"Business details updated",createdAt:new Date().toISOString()});
                      return {...s,draft,revisions,status:s.status};
                    }) }
                    : await api<Plan>("/plans/" + plan._id, "PUT", v),
                );
                setOpen(false);
              } catch (e) {
                setError((e as Error).message);
              }
            })}
          >
            <label>
              Business name
              <input {...register("name")} />
              {errors.name && (
                <small className="error-text">{errors.name.message}</small>
              )}
            </label>
            <label>
              Description
              <textarea {...register("description")} />
              {errors.description && (
                <small className="error-text">
                  {errors.description.message}
                </small>
              )}
            </label>
            {error && <p className="error-text">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>Save details</Button>
          </form>
        </Modal>
      )}
    </>
  );
}
