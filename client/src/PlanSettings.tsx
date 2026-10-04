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
          {isSubmitting && <LoadingScreen label="Saving business details…" />}
          <form
            noValidate
            onSubmit={handleSubmit(async (v) => {
              try {
                onUpdate(
                  isDemo
                    ? { ...plan, ...v }
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
