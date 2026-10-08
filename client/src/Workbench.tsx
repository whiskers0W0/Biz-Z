import type { Plan } from "./data";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "./data";
import { Button, Modal, LoadingScreen, PageHeading } from "./components";
import { financialSchema, budgetSchema, taskSchema } from "./schemas/workbench";
import type {
  FinancialValues,
  BudgetValues,
  TaskValues,
} from "./schemas/workbench";
type Finance = {
  currency: FinancialValues["currency"];
  capitalMinor: number;
  priceMinor: number;
  variableMinor: number;
  units: number;
};
type Item = {
  _id: string;
  name: string;
  category: "startup" | "monthly";
  amountMinor: number;
  quantity: number;
};
type Task = TaskValues & { _id: string };
type Summary = {
  currency: string;
  startup: number;
  fixed: number;
  capital: number;
  fundingGap: number;
  opening: number;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number | null;
  runway: number | null;
  runwayReason: string;
};
type BreakEven = { contribution: number; units: number | null; reason: string };
type TasksSummary = {
  total: number;
  completed: number;
  percent: number;
  overdue: number;
  upcoming: Task[];
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function Workbench({
  planId,
  mode,
  isDemo,
  onUpdate,
}: {
  onUpdate: (plan: Plan) => void;
  planId: string;
  mode: "money" | "launch";
  isDemo: boolean;
}) {
  const [suggestions, setSuggestions] = useState<{tasks?:{title:string;reason:string}[];values?:{field:"capital"|"price"|"variable"|"units";value:number;source:string}[]} | null>(null);
  const [suggesting,setSuggesting] = useState(false);
  async function suggest(choice: "money"|"launch"|"template") {
    setSuggesting(true);setError("");
    try {setSuggestions(await api(base+"/tool-suggestions","POST",{mode:choice}));}
    catch(e){setError((e as Error).message);}finally{setSuggesting(false);}
  }
  const base = "/plans/" + planId;
  const [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [items, setItems] = useState<Item[]>([]),
    [tasks, setTasks] = useState<Task[]>([]),
    [summary, setSummary] = useState<Summary | null>(null),
    [even, setEven] = useState<BreakEven | null>(null),
    [stats, setStats] = useState<TasksSummary | null>(null);
  const [scenario, setScenario] = useState<(Summary & { units: number })[]>([]);
  const [editing, setEditing] = useState<{
      id?: string;
      kind: "cost" | "task";
    } | null>(null),
    [deleting, setDeleting] = useState<{
      id: string;
      kind: "cost" | "task";
    } | null>(null);
  const form = useForm<FinancialValues>({
    resolver: zodResolver(financialSchema),
    defaultValues: {
      currency: "PHP",
      capital: 0,
      price: 0,
      variable: 0,
      units: 0,
    },
  });
  const cost = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { name: "", category: "startup", amount: 0, quantity: 1 },
  });
  const task = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", dueDate: today(), done: false },
  });
  const [savedUnits, setSavedUnits] = useState(0);
  const { reset } = form;
  const load = useCallback(async () => {
    if (isDemo) return;
    setLoading(true);
    setError("");
    try {
      if (mode === "money") {
        const [f, i, s, b] = await Promise.all([
          api<Finance>(base + "/finance"),
          api<Item[]>(base + "/budget-items"),
          api<Summary>(base + "/financial-summary"),
          api<BreakEven>(base + "/break-even"),
        ]);
        reset({
          currency: f.currency,
          capital: f.capitalMinor / 100,
          price: f.priceMinor / 100,
          variable: f.variableMinor / 100,
          units: f.units,
        });
        setSavedUnits(f.units);
        setItems(i);
        setSummary(s);
        setEven(b);
        setScenario([]);
      } else {
        const [t, s] = await Promise.all([
          api<Task[]>(base + "/tasks"),
          api<TasksSummary>(base + "/task-summary?today=" + today()),
        ]);
        setTasks(t);
        setStats(s);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [base, isDemo, mode, reset]);
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);
  async function mutate(path: string, method: string, data?: unknown) {
    setLoading(true);
    try {
      await api(path, method, data);
      onUpdate(await api<Plan>(base));
      await load();
      setEditing(null);
      setDeleting(null);
      setNotice("Your changes are saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  const money = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: summary?.currency || "PHP",
    }).format(n / 100);
  if (isDemo)
    return (
      <>
        <PageHeading
          eyebrow="YOUR PLAN TOOLS"
          title={mode === "money" ? "Money lab" : "Launch checklist"}
          text="Sign in to save your costs, assumptions and tasks to your account."
        />
        <p className="soft-note">
          These tools use your saved database records. Open your account from
          the sidebar to continue.
        </p>
      </>
    );
  return (
    <>
      <PageHeading
        eyebrow="FROM PLAN TO POSSIBILITY"
        title={mode === "money" ? "Money lab" : "Launch checklist"}
        text={
          mode === "money"
            ? "See estimates from your saved inputs."
            : "Track your next steps."
        }
      />
      {loading && <LoadingScreen label="Updating your workspace…" />}
      {error && (
        <Modal title="We couldn’t complete that" onClose={() => setError("")}>
          <p>{error}</p>
          <Button
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Retry loading
          </Button>
        </Modal>
      )}
      {notice && (
        <Modal title="Saved" onClose={() => setNotice("")}>
          <p>{notice}</p>
          <Button onClick={() => setNotice("")}>Continue</Button>
        </Modal>
      )}
      <div className="tool-suggestions"><Button variant="secondary" disabled={suggesting || loading} onClick={()=>void suggest(mode)}>{suggesting ? "Preparing suggestions…" : mode === "money" ? "Use values from my plan" : "Generate from my plan"}</Button>{mode === "launch" && <Button variant="secondary" disabled={suggesting || loading} onClick={()=>void suggest("template")}>Use a checklist template</Button>}<p>{mode === "money" ? "Review extracted values before saving. Missing numbers stay unchanged." : "Generate tailored tasks, use section templates, or add your own."}</p></div>
      {suggestions && <Modal title={mode === "money" ? "Values from your plan" : "Suggested launch steps"} onClose={()=>setSuggestions(null)}>
        {suggestions.values?.map(v=><div className="suggestion-item" key={v.field}><strong>{v.field}: {v.value}</strong><p>{v.source}</p></div>)}
        {suggestions.values?.length===0 && <p>No clear values found. Enter your assumptions manually.</p>}
        {suggestions.tasks?.filter(t=>!tasks.some(saved=>saved.title===t.title)).map(t=><div className="suggestion-item" key={t.title}><strong>{t.title}</strong><p>{t.reason}</p><Button variant="secondary" onClick={()=>{task.reset({title:t.title,dueDate:today(),done:false});setSuggestions(null);setEditing({kind:"task"});}}>Choose and set date</Button></div>)}
        {suggestions.tasks?.length===0 && <p>Draft your plan sections to create relevant tasks.</p>}
        <Button variant="secondary" onClick={()=>setSuggestions(null)}>Close</Button>
        {!!suggestions.values?.length && <Button onClick={()=>{suggestions.values?.forEach(v=>form.setValue(v.field,v.value,{shouldDirty:true,shouldValidate:true}));setSuggestions(null);setNotice("Values filled in. Review and save your assumptions.");}}>Fill in these values</Button>}
      </Modal>}
      {mode === "money" ? (
        <>
          <section className="tool-card">
            <h2>Your sales assumptions</h2>
            <p>
              Estimate one product or service. Changing currency does not convert amounts.
            </p>
            <form
              onSubmit={form.handleSubmit((v) =>
                mutate(base + "/finance", "PUT", {
                  currency: v.currency,
                  capitalMinor: Math.round(v.capital * 100),
                  priceMinor: Math.round(v.price * 100),
                  variableMinor: Math.round(v.variable * 100),
                  units: v.units,
                }),
              )}
            >
              <div className="tool-grid">
                <label>
                  Currency
                  <select {...form.register("currency")}>
                    {["PHP", "USD", "EUR", "GBP", "SGD"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                {(["capital", "price", "variable", "units"] as const).map(
                  (k) => (
                    <label key={k}>
                      {
                        {
                          capital: "Available capital",
                          price: "Price per sale",
                          variable: "Variable cost per sale",
                          units: "Expected monthly sales",
                        }[k]
                      }
                      <input
                        type="number"
                        min="0"
                        step={k === "units" ? "1" : "0.01"}
                        {...form.register(k, { valueAsNumber: true })}
                      />
                      {form.formState.errors[k] && (
                        <small className="error-text">
                          {form.formState.errors[k]?.message}
                        </small>
                      )}
                    </label>
                  ),
                )}
              </div>
              <Button type="submit" disabled={loading}>Save assumptions</Button>
            </form>
          </section>
          <section className="tool-card">
            <div className="tool-heading">
              <h2>Your costs</h2>
              <Button
                onClick={() => {
                  cost.reset({
                    name: "",
                    category: "startup",
                    amount: 0,
                    quantity: 1,
                  });
                  setEditing({ kind: "cost" });
                }}
              >
                Add a cost
              </Button>
            </div>
            {!items.length ? (
              <p>
                No costs yet. Start with equipment, supplies or monthly rent.
              </p>
            ) : (
              items.map((i) => (
                <div className="resource-row" key={i._id}>
                  <div>
                    <strong>{i.name}</strong>
                    <p>
                      {i.category === "startup"
                        ? "One-time startup"
                        : "Monthly fixed"}{" "}
                      · {i.quantity} × {money(i.amountMinor)} ={" "}
                      {money(i.amountMinor * i.quantity)}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        cost.reset({
                          name: i.name,
                          category: i.category,
                          amount: i.amountMinor / 100,
                          quantity: i.quantity,
                        });
                        setEditing({ kind: "cost", id: i._id });
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setDeleting({ kind: "cost", id: i._id })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </section>
          {summary && (
            <section className="tool-card">
              <h2>What your numbers say</h2>
              <div className="tool-grid">
                {(
                  [
                    "startup",
                    "fixed",
                    "fundingGap",
                    "revenue",
                    "expenses",
                    "profit",
                  ] as const
                ).map((k) => (
                  <div className="metric" key={k}>
                    <span>
                      {
                        {
                          startup: "Startup total",
                          fixed: "Monthly fixed costs",
                          fundingGap: "Funding gap",
                          revenue: "Monthly revenue",
                          expenses: "Monthly expenses",
                          profit: "Monthly operating profit",
                        }[k]
                      }
                    </span>
                    <strong>{money(summary[k])}</strong>
                  </div>
                ))}
              </div>
              <p>
                Profit margin:{" "}
                {summary.margin === null
                  ? "Not applicable without revenue"
                  : summary.margin + "%"}
              </p>
              <p>
                Cash runway:{" "}
                {summary.runway === null
                  ? summary.runwayReason
                  : summary.runway + " months"}
              </p>
              <p>
                Break-even:{" "}
                {even?.units === null
                  ? even.reason
                  : even?.units + " sales per month"}
                . Contribution per sale: {money(even?.contribution || 0)}.
              </p>
              <p className="soft-note">
                Working estimates only. Excludes taxes, debt payments and
                working-capital timing. Revenue = price × sales; profit =
                revenue − variable costs − fixed costs.
              </p>
              <Button
                variant="secondary"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const u = savedUnits;
                    setScenario(
                      await api(base + "/scenario-comparisons", "POST", {
                        units: [Math.floor(u * 0.7), u, Math.ceil(u * 1.3)],
                      }),
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Compare 70%, 100% and 130% of monthly sales
              </Button>
              {scenario.length > 0 && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Sales</th>
                        <th>Revenue</th>
                        <th>Profit</th>
                        <th>Runway</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scenario.map((s, i) => (
                        <tr key={["cautious", "expected", "optimistic"][i]}>
                          <td>{s.units}</td>
                          <td>{money(s.revenue)}</td>
                          <td>{money(s.profit)}</td>
                          <td>
                            {s.runway === null
                              ? s.runwayReason
                              : s.runway + " months"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <section className="tool-card">
          <div className="tool-heading">
            <h2>
              {stats?.completed || 0} of {stats?.total || 0} complete
            </h2>
            <Button
              onClick={() => {
                task.reset({ title: "", dueDate: today(), done: false });
                setEditing({ kind: "task" });
              }}
            >
              Add a task
            </Button>
          </div>
          <p>
            {stats?.percent || 0}% complete · {stats?.overdue || 0} overdue.
            Dates use your local calendar day.
          </p>
          {!tasks.length ? (
            <p>Your checklist is empty. Add your first launch step.</p>
          ) : (
            tasks.map((t) => (
              <div className="resource-row launch-task" key={t._id}>
                <div className="task-copy">
                  <strong>
                    {t.done ? "✓ " : ""}
                    {t.title}
                  </strong>
                  <p>
                    Due {t.dueDate} ·{" "}
                    {t.done
                      ? "Complete"
                      : t.dueDate < today()
                        ? "Overdue"
                        : "To do"}
                  </p>
                </div>
                <div className="task-actions">
                  <Button disabled={loading} variant="secondary" onClick={()=>void mutate(base+"/tasks/"+t._id,"PUT",{title:t.title,dueDate:t.dueDate,done:!t.done})}>{t.done ? "Reopen" : "Mark done"}</Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      task.reset(t);
                      setEditing({ kind: "task", id: t._id });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setDeleting({ kind: "task", id: t._id })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </section>
      )}
      {editing?.kind === "cost" && (
        <Modal
          title={editing.id ? "Edit cost" : "Add cost"}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={cost.handleSubmit((v) =>
              mutate(
                base + "/budget-items" + (editing.id ? "/" + editing.id : ""),
                editing.id ? "PUT" : "POST",
                {
                  name: v.name,
                  category: v.category,
                  amountMinor: Math.round(v.amount * 100),
                  quantity: v.quantity,
                },
              ),
            )}
          >
            <label>
              Name
              <input {...cost.register("name")} />
            </label>
            <label>
              Type
              <select {...cost.register("category")}>
                <option value="startup">Startup cost</option>
                <option value="monthly">Monthly fixed cost</option>
              </select>
            </label>
            <label>
              Amount per unit
              <input
                type="number"
                step="0.01"
                {...cost.register("amount", { valueAsNumber: true })}
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                {...cost.register("quantity", { valueAsNumber: true })}
              />
            </label>
            {Object.entries(cost.formState.errors).map(([key, e]) => (
              <p className="error-text" key={key}>
                {e.message}
              </p>
            ))}
            <Button type="submit" disabled={loading}>Save cost</Button>
          </form>
        </Modal>
      )}
      {editing?.kind === "task" && (
        <Modal
          title={editing.id ? "Edit task" : "Add task"}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={task.handleSubmit((v) =>
              mutate(
                base + "/tasks" + (editing.id ? "/" + editing.id : ""),
                editing.id ? "PUT" : "POST",
                v,
              ),
            )}
          >
            <label>
              Task
              <input {...task.register("title")} />
            </label>
            <label>
              Due date
              <input type="date" {...task.register("dueDate")} />
            </label>
            <label>
              <input type="checkbox" {...task.register("done")} />
              Completed
            </label>
            {Object.entries(task.formState.errors).map(([key, e]) => (
              <p className="error-text" key={key}>
                {e.message}
              </p>
            ))}
            <Button type="submit" disabled={loading}>Save task</Button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this item?" onClose={() => setDeleting(null)}>
          <p>This removes the item from this plan. Calculations will update.</p>
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Keep it
          </Button>
          <Button
            onClick={() =>
              mutate(
                base +
                  "/" +
                  (deleting.kind === "cost" ? "budget-items" : "tasks") +
                  "/" +
                  deleting.id,
                "DELETE",
              )
            }
          >
            Delete
          </Button>
        </Modal>
      )}
    </>
  );
}
