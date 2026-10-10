import { Pencil, Trash2 } from "lucide-react";
import type { Plan } from "./data";
import { useEffect, useState, useCallback, useRef } from "react";
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
type Task = TaskValues & { _id: string; phase?:string; details?:string; links?:string[] };
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
  const [derived,setDerived] = useState<{missing:string[];costsMissing?:boolean;stale?:boolean} | null>(null);
  const [editFinance,setEditFinance] = useState(false);

  const { reset } = form;
  const load = useCallback(async () => {
    if (isDemo) return;
    setLoading(true);
    setError("");
    try {
      let preparation: {missing:string[];costsMissing?:boolean;stale?:boolean} | null = null;
      try { if (mode === "launch") await api(base + "/prepare-tools", "POST"); preparation = {missing:[]}; setDerived(preparation); } catch(e) { setError((e as Error).message); setDerived({missing:["Unverified inputs"],costsMissing:true}); }
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

        setItems(i);
        setSummary(s);
        setEven(b);
        setScenario(preparation && !preparation.missing.length && !preparation.costsMissing ? await api(base + "/scenario-comparisons", "POST", {units:[Math.floor(f.units * 0.7),f.units,Math.ceil(f.units * 1.3)]}) : []);
      } else {
        const [t, s] = await Promise.all([
          api<Task[]>(base + "/tasks"),
          api<TasksSummary>(base + "/task-summary?today=" + today()),
        ]);
        setTasks(t.sort((a,b)=>(a.phase || "2").localeCompare(b.phase || "2")));
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
  const toggleLock = useRef(false);
  const [toggling,setToggling] = useState<string|null>(null);
  const [checkNotice,setCheckNotice] = useState("");
  function updateChecklist(next:Task[]) {
    setTasks(next);
    const completed=next.filter(t=>t.done).length;
    setStats({total:next.length,completed,percent:next.length?Math.round(completed/next.length*100):0,overdue:next.filter(t=>!t.done&&t.dueDate&&t.dueDate<today()).length,upcoming:next.filter(t=>!t.done&&t.dueDate&&t.dueDate>=today()).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)).slice(0,5)});
  }
  async function toggleTask(t:Task) {
    if(toggleLock.current)return;
    toggleLock.current=true;setToggling(t._id);setCheckNotice("");
    const previous=tasks;
    updateChecklist(tasks.map(x=>x._id===t._id?{...x,done:!t.done}:x));
    try {
      await api(base+"/tasks/"+t._id,"PUT",{title:t.title,dueDate:t.dueDate,phase:t.phase,details:t.details,done:!t.done});
      setCheckNotice(t.done?"Task reopened.":"Task completed.");
    } catch {updateChecklist(previous);setCheckNotice("Could not save the check. Please try again.");}
    finally {toggleLock.current=false;setToggling(null);}
  }
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
      {derived?.stale && <p className="soft-note">The plan has changed since these tools were prepared. Review your saved figures and tasks.</p>}
      {mode === "money" ? (
        <>
          <section className="tool-card">
            <div className="tool-heading"><h2>Plan-derived assumptions</h2><Button variant="secondary" onClick={()=>setEditFinance(v=>!v)}>{editFinance ? "Close editing" : "Edit assumptions"}</Button></div>
            {derived && (derived.missing.length>0 || derived.costsMissing) && <p role="status">Not specified in your plan: {[...derived.missing,...(derived.costsMissing?["cost breakdown"]:[])].join(", ")}. Calculations below are incomplete until these values are supplied.</p>}
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
                  <select disabled={!editFinance} {...form.register("currency")}>
                    {["PHP", "USD", "EUR", "GBP", "SGD", "AUD", "CAD", "NZD", "HKD", "CNY", "JPY", "KRW", "INR", "MYR", "THB", "IDR", "VND", "AED", "SAR", "CHF"].map((c) => (
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
                        readOnly={!editFinance}
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
              {editFinance && <Button type="submit" disabled={loading}>Save assumptions</Button>}
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
                    <strong>{derived && (derived.missing.length>0 || derived.costsMissing) ? "Needs inputs" : money(summary[k])}</strong>
                    <small>{({startup:"One-time costs before opening.",fixed:"Recurring monthly costs, independent of sales.",fundingGap:"Startup costs minus available capital, if positive.",revenue:"Price per sale multiplied by monthly sales.",expenses:"Variable costs plus recurring monthly costs.",profit:"Revenue minus operating expenses, before tax."})[k]}</small>
                  </div>
                ))}
              </div>
              <div hidden={!!derived && (derived.missing.length>0 || !!derived.costsMissing)}><p>
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
              </div><details className="money-glossary"><summary>What do these terms mean?</summary><p><strong>Capital:</strong> funds available to start. <strong>Variable cost:</strong> cost incurred for each sale. <strong>Contribution:</strong> price minus variable cost per sale.</p><p><strong>Break-even:</strong> monthly sales needed to cover fixed costs. <strong>Profit margin:</strong> operating profit as a percentage of revenue. <strong>Runway:</strong> months remaining cash can cover projected losses.</p></details>
              <p className="soft-note">
                Working estimates only. Excludes taxes, debt payments and
                working-capital timing. Revenue = price × sales; profit =
                revenue − variable costs − fixed costs.
              </p>
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
              disabled={loading || !!toggling}
              onClick={() => {
                task.reset({ title: "", dueDate: today(), done: false });
                setEditing({ kind: "task" });
              }}
            >
              Add a task
            </Button>
          </div>
          <div className="launch-progress">
            <progress aria-label="Launch checklist completion" value={stats?.completed || 0} max={stats?.total || 1} />
            <div className="launch-progress-caption">
              <span>{stats?.percent || 0}% complete</span>
              {!!stats?.overdue && <span className="launch-overdue">{stats.overdue} overdue</span>}
            </div>
          </div>
          <p className="launch-check-hint">Check a task to mark it complete.</p>
          <p className="checklist-save-status" role="status" aria-live="polite">{checkNotice}</p>
          {!tasks.length ? (
            <p>Your checklist is empty. Add your first launch step.</p>
          ) : (
            tasks.map((t, index) => (
              <div key={t._id}>
                {(index===0 || tasks[index-1].phase!==t.phase) && <h3 className="launch-phase">{t.phase || "2. Operations & funding"}<span>{tasks.filter(x=>x.phase===t.phase&&x.done).length}/{tasks.filter(x=>x.phase===t.phase).length}</span></h3>}
                <article className={"checklist-task"+(t.done?" is-complete":"")} aria-busy={toggling===t._id}>
                  <label className="launch-check-target" title={t.done ? "Mark as to do" : "Mark complete"}>
                    <input id={"check-"+t._id} className="launch-checkbox" type="checkbox" aria-label={(t.done ? "Reopen " : "Complete ")+t.title} checked={t.done} disabled={loading || !!toggling} onChange={()=>void toggleTask(t)} />
                  </label>
                  <div className="checklist-task-body">
                    <label htmlFor={"check-"+t._id} className="checklist-title">{t.title}</label>
                    <div className="checklist-meta"><span>{toggling===t._id?"Saving…":t.done?"Complete":t.dueDate&&t.dueDate<today()?"Overdue":"To do"}</span>{t.dueDate&&<time dateTime={t.dueDate}>Due {t.dueDate}</time>}</div>
                    {(t.details || !!t.links?.length) && <details className="checklist-details"><summary>Details & resources</summary>{t.details&&<p>{t.details}</p>}<div className="checklist-links">{t.links?.map((link,i)=><a href={link} key={link} target="_blank" rel="noreferrer">Agency guide {i+1} ↗</a>)}</div></details>}
                  </div>
                  <div className="checklist-task-actions">
                    <button type="button" disabled={loading||!!toggling} className="text-button" aria-label={"Edit "+t.title} title="Edit task" onClick={()=>{task.reset(t);setEditing({kind:"task",id:t._id});}}><Pencil size={18}/></button>
                    <button type="button" disabled={loading||!!toggling} className="text-button" aria-label={"Delete "+t.title} title="Delete task" onClick={()=>setDeleting({kind:"task",id:t._id})}><Trash2 size={18}/></button>
                  </div>
                </article>
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
              <label>Phase<select {...task.register("phase")}>{["1. Registration & compliance","2. Operations & funding","3. Market launch","4. Monitor & improve"].map(p=><option key={p}>{p}</option>)}</select></label>
              <label>Details and documents<textarea {...task.register("details")} maxLength={2000}/></label>
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
