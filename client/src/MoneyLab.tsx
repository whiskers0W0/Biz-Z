import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calculator,
  Bookmark,
  BookOpen,
  TrendingUp,
  Tags,
  Target,
  Hourglass,
  Landmark,
  Sprout,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import { Bee, Button, Modal, PageHeading } from "./components";
import { api } from "./data";
import {
  calculators,
  currencies,
  calculationSchema,
  calculate,
} from "../../shared/moneyLab.js";
import type { CalculationInput } from "../../shared/moneyLab.js";
type Saved = CalculationInput & { _id: string; updatedAt: string };
const tileIcons: Record<string, typeof TrendingUp> = { profit: TrendingUp, pricing: Tags, "break-even": Target, runway: Hourglass, loan: Landmark, roi: Sprout };
const storageKey = "bizz-money-lab-v1";
const blank = (kind = "profit"): CalculationInput => ({
  title: "",
  kind,
  currency: "PHP",
  inputs: Object.fromEntries((calculators.find(c=>c.id===kind)?.fields || []).map(f=>[f.key,NaN])),
});
const terms = [
  ["Revenue", "Total sales before subtracting any costs."],
  [
    "Fixed costs",
    "Costs such as rent that usually stay the same as sales volume changes.",
  ],
  [
    "Variable costs",
    "Costs that increase with each sale, such as materials or packaging.",
  ],
  [
    "Operating profit",
    "Revenue minus variable and fixed operating costs, before taxes and financing.",
  ],
  ["Margin", "Profit as a percentage of the selling price or revenue."],
  ["Markup", "The amount added to cost, expressed as a percentage of cost."],
  [
    "Contribution",
    "Selling price minus variable cost per sale. This amount helps cover fixed costs.",
  ],
  ["Break-even", "The sales level at which total revenue covers total costs."],
  ["Cash burn", "Monthly cash paid out minus monthly cash collected."],
  [
    "Runway",
    "How long available cash can cover a continuing monthly cash shortfall.",
  ],
  ["Principal", "The amount borrowed before interest and fees."],
  ["Interest", "The charge for borrowing money."],
  ["ROI", "Return on investment: net gain divided by the initial investment."],
];
export function MoneyLab({
  isDemo,
  onDirty,
}: {
  isDemo: boolean;
  onDirty: (dirty: boolean) => void;
}) {
  const form = useForm<CalculationInput>({
    resolver: zodResolver(calculationSchema),
    defaultValues: blank(),
    mode: "onChange",
  });
  const [saved, setSaved] = useState<Saved[]>([]),
    [id, setId] = useState<string>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [tab, setTab] = useState("calculate"),
    [search, setSearch] = useState(""),
    [pending, setPending] = useState<(() => void) | null>(null),
    [deleting, setDeleting] = useState<Saved | null>(null);
  const values = useWatch({ control: form.control }) as CalculationInput,
    config = calculators.find((c) => c.id === values.kind) || calculators[0];
  const parsed = calculationSchema.safeParse({
    ...values,
    title: values.title || config.name,
  });
  const results = parsed.success
    ? calculate(parsed.data.kind, parsed.data.inputs)
    : [];
  const dirty = form.formState.isDirty;
  useEffect(() => {
    onDirty(dirty);
    return () => onDirty(false);
  }, [dirty, onDirty]);
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [dirty]);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const records: Saved[] = isDemo
          ? JSON.parse(localStorage.getItem(storageKey) || "[]")
          : await api("/calculations");
        if (!Array.isArray(records))
          throw Error("Saved calculations could not be read.");
        if (!cancelled)
          setSaved(
            records.filter((r) => calculationSchema.safeParse(r).success),
          );
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [isDemo]);
  const switchTo = (action: () => void) => {
    if (busy) return;
    if (dirty) setPending(() => action);
    else action();
  };
  const open = (record?: Saved, kind = "profit") => {
    form.reset(
      record
        ? {
            title: record.title,
            kind: record.kind,
            currency: record.currency,
            inputs: record.inputs,
          }
        : blank(kind),
    );
    setId(record?._id);
    setNotice("");
    setTab("calculate");
  };
  const format = (value: number | null, unit: string) =>
    value === null
      ? "Not applicable"
      : unit === "money"
        ? new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: values.currency,
          }).format(value)
        : new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
            value,
          ) + (unit === "percent" ? "%" : unit === "months" ? " months" : "");
  async function save(v: CalculationInput, copy = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      let record: Saved;
      if (isDemo) {
        if ((!id || copy) && saved.length >= 200)
          throw Error("You can save up to 200 calculations.");
        record = {
          ...v,
          _id: !copy && id ? id : crypto.randomUUID(),
          updatedAt: new Date().toISOString(),
        };
        const next = [record, ...saved.filter((s) => s._id !== record._id)];
        localStorage.setItem(storageKey, JSON.stringify(next));
        setSaved(next);
      } else {
        record = await api(
          "/calculations" + (!copy && id ? "/" + id : ""),
          !copy && id ? "PUT" : "POST",
          v,
        );
        setSaved((prev) => [
          record,
          ...prev.filter((s) => s._id !== record._id),
        ]);
      }
      setId(record._id);
      form.reset(v);
      setNotice(isDemo ? "Saved on this device." : "Calculation saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      const next = saved.filter((s) => s._id !== deleting._id);
      if (isDemo) localStorage.setItem(storageKey, JSON.stringify(next));
      else await api("/calculations/" + deleting._id, "DELETE");
      setSaved(next);
      if (id === deleting._id) open();
      setDeleting(null);
      setNotice("Calculation deleted.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="money-lab">
      <PageHeading
        eyebrow="MAKE SENSE OF YOUR NUMBERS"
        title="Money Lab"
        text="Try the numbers. Find your next move."
      />
      <div className="money-intro">
        <Bee size={64} />
        <div>
          <h2>A little clarity, before you decide.</h2>
          <p>Explore a scenario and keep the calculations that help.</p>
        </div>
      </div>
      <nav className="money-tabs" aria-label="Money Lab views">
        {[
          ["calculate", "Calculators", Calculator],
          ["saved", "Saved", Bookmark],
          ["glossary", "Glossary", BookOpen],
        ].map(([key, label, Icon]) => (
          <button
            key={key as string}
            type="button"
            disabled={busy}
            className={tab === key ? "active" : ""}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => setTab(key as string)}
          >
            {typeof Icon !== "string" && <Icon size={18} />} {label as string}
            {key === "saved" ? ` (${saved.length})` : ""}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="error-text">
          {error}{" "}
          <button className="text-button" onClick={() => setError("")}>
            Dismiss
          </button>
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {tab === "calculate" && (
        <>
          <div className="calculator-choices">
            {calculators.map((c) => { const Icon = tileIcons[c.id]; return (
              <button
                key={c.id}
                disabled={busy}
                className={`calculator-tile tile-${c.id}`}
                type="button"
                aria-pressed={c.id === values.kind}
                onClick={() => switchTo(() => open(undefined, c.id))}
              >
                <span className="calculator-tile-top" aria-hidden="true"><span className="calculator-tile-icon"><Icon size={28} strokeWidth={2.4}/></span><span className="calculator-tile-check">{c.id === values.kind && <Check size={16} strokeWidth={3}/>}</span></span>
                <strong>{c.name}</strong>
                <span className="calculator-tile-description">{c.description}</span>
              </button>
            );})}
          </div>
          <form
            onSubmit={form.handleSubmit((v) => save(v))}
            className="calculator-workspace"
          >
            <section className="tool-card">
              <fieldset disabled={busy} className="calculator-fields">
              <div className="tool-heading">
                <h2>{config.name}</h2>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => switchTo(() => open(undefined, values.kind))}
                >
                  <Plus size={16} />
                  Start fresh
                </button>
              </div>
              <p className="calculator-purpose">{config.description}</p>
              <div className="tool-grid calculator-identity">
                <label>
                  Calculation name
                  <input
                    placeholder="e.g. Weekend coffee stall"
                    maxLength={100}
                    {...form.register("title")}
                  />
                  {form.formState.errors.title && (
                    <small className="error-text">
                      Give this calculation a name to save it.
                    </small>
                  )}
                </label>
                <label>
                  Currency
                  <select {...form.register("currency")}>
                    {currencies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="tool-grid calculator-inputs">
                {config.fields.map((f) => (
                  <label key={config.id + f.key}>
                    {f.label}
                    {f.unit === "percent" ? " (%)" : ""}
                    <input
                      type="number"
                      min="0"
                      step={f.unit === "number" ? "1" : "any"}
                      placeholder={f.unit === "percent" ? "Enter percentage" : f.unit === "number" ? "Enter quantity" : "Enter amount"}
                      aria-describedby={`help-${config.id}-${f.key}`}
                      {...form.register(`inputs.${f.key}`, {
                        valueAsNumber: true,
                      })}
                    />
                    <small id={`help-${config.id}-${f.key}`}>{f.help}</small>
                    {form.formState.errors.inputs?.[f.key] && (
                      <small className="error-text">
                        {String(form.formState.errors.inputs[f.key]?.message)}
                      </small>
                    )}
                  </label>
                ))}
              </div>
              <p className="calculator-currency-note">
                Currency labels only. No conversion.
              </p>
              </fieldset>
            </section>
            <section
              className="tool-card calculator-results"
              aria-label="Calculation results"
            >
              <div className="tool-heading"><h2>Your results</h2><span className="calculator-live">Updates as you type</span></div>
              {!parsed.success ? (
                <div className="calculator-empty"><Calculator size={28} aria-hidden="true" /><p>Enter your numbers to see the result.</p></div>
              ) : (
                <>
                  <div className="calculator-metrics">
                    {results.map((r) => (
                      <div key={r.label}>
                        <span>{r.label}</span>
                        <strong>{format(r.value, r.unit)}</strong>
                      </div>
                    ))}
                  </div>
                  {values.kind === "runway" &&
                    values.inputs.outflow <= values.inputs.inflow && (
                      <p>
                        Cash is not shrinking under these assumptions, so there
                        is no finite runway.
                      </p>
                    )}
                  {values.kind === "break-even" &&
                    values.inputs.price <= values.inputs.cost && (
                      <p>
                        Each sale must contribute more than its variable cost to
                        reach break-even.
                      </p>
                    )}
                </>
              )}
              <section className="calculator-explainer" aria-label="How this calculation works">
                <h3><BookOpen size={18} aria-hidden="true" />How it works</h3>
                <p className="calculator-formula">{config.formula}</p>
                <p className="calculator-limits">{config.note}</p>
              </section>
              <div className="money-save">
                <Button type="submit" disabled={busy || !parsed.success}>
                  {busy ? "Saving…" : id ? "Save changes" : "Save calculation"}
                </Button>
                {id && (
                  <Button
                    variant="secondary"
                    disabled={busy || !parsed.success}
                    onClick={() =>
                      void form.handleSubmit((v) => save(v, true))()
                    }
                  >
                    Save a copy
                  </Button>
                )}
                <small>
                  {dirty ? "Unsaved changes" : id ? "Saved" : ""}
                  {isDemo ? " · Stored on this device" : ""}
                </small>
              </div>
            </section>
          </form>
        </>
      )}
      {tab === "saved" && (
        <section className="tool-card">
          <div className="tool-heading">
            <h2>Saved calculations</h2>
            <Button variant="secondary" onClick={() => switchTo(() => open())}>
              New calculation
            </Button>
          </div>
          <p className="soft-note">
            {isDemo
              ? "Saved on this browser only."
              : "Private to your account."}
          </p>
          {!saved.length ? (
            <p>
              No calculations saved yet. Try a calculator and give your scenario
              a name.
            </p>
          ) : (
            <div className="saved-calculations">
              {saved.map((s) => (
                <article key={s._id}>
                  <div>
                    <h3>{s.title}</h3>
                    <p>
                      {calculators.find((c) => c.id === s.kind)?.name} ·{" "}
                      {s.currency}
                    </p>
                    <small>{new Date(s.updatedAt).toLocaleDateString()}</small>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => switchTo(() => open(s))}
                  >
                    Open
                  </Button>
                  <button
                    type="button"
                    className="text-button"
                    aria-label={"Delete " + s.title}
                    onClick={() => setDeleting(s)}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
      {tab === "glossary" && (
        <section className="tool-card">
          <h2>Business terms, made simple</h2>
          <label>
            Find a term
            <input
              type="search"
              placeholder="Try margin or runway"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <dl className="money-glossary-grid">
            {terms
              .filter((t) =>
                t.join(" ").toLowerCase().includes(search.toLowerCase()),
              )
              .map(([term, meaning]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
          </dl>
          {!terms.some((t) =>
            t.join(" ").toLowerCase().includes(search.toLowerCase()),
          ) && <p>No matching terms. Try another word.</p>}
        </section>
      )}
      {pending && (
        <Modal
          title="Discard unsaved changes?"
          onClose={() => setPending(null)}
        >
          <p>Your saved calculations will stay unchanged.</p>
          <Button variant="secondary" onClick={() => setPending(null)}>
            Keep editing
          </Button>
          <Button
            onClick={() => {
              pending();
              setPending(null);
            }}
          >
            Discard changes
          </Button>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete calculation?" onClose={() => setDeleting(null)}>
          <p>Delete “{deleting.title}”?</p>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setDeleting(null)}
          >
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void remove()}>
            Delete
          </Button>
        </Modal>
      )}
    </div>
  );
}
