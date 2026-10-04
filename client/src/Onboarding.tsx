import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileFormSchema } from "./schemas/forms";
import type { ProfileValues } from "./schemas/forms";

import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Lightbulb,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { LoadingScreen, Bee, Button, Modal, PageHeading } from "./components";
import { api, interests, traits, sampleIdeas } from "./data";
import type { Idea, Profile } from "./data";
export function Onboarding({
  profile,
  onComplete,
  onExit,
}: {
  profile: Profile;
  onComplete: (p: Profile) => Promise<void>;
  onExit: () => void;
}) {
  const [step, setStep] = useState(0);
  const {
    control,
    reset,
    getValues,
    trigger,
    formState: { errors: profileErrors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profile,
  });
  const data = useWatch({ control }) as ProfileValues;
  function setData(
    next: ProfileValues | ((p: ProfileValues) => ProfileValues),
  ) {
    reset(typeof next === "function" ? next(getValues()) : next, {
      keepErrors: true,
    });
  }
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const headings = [
    "What sparks your interest?",
    "What makes you, you?",
    "You bring more than you think.",
    "Let’s find your starting point.",
    "Yep, this looks like you.",
  ];
  const subheads = [
    "Choose 5 interests.",
    "Choose 5 work traits.",
    "Add your skills and available time.",
    "Set your location and budget.",
    "Check your profile.",
  ];
  const key = step === 0 ? "interests" : "traits";
  const selected = data[key];
  const valid =
    step < 2
      ? selected.length === 5
      : step === 2
        ? data.hours > 0 && data.hours <= 168
        : step === 3
          ? data.location.trim().length > 0 &&
            data.capital >= 0 &&
            data.monthly >= 0
          : true;
  return (
    <div className="onboarding">
      {saving && <LoadingScreen label="Saving your profile…" />}
      <div className="onboard-top">
        <button
          className="icon-btn"
          onClick={onExit}
          aria-label="Exit onboarding"
        >
          <X size={21} />
        </button>
        <div className="onboard-track">
          <span style={{ width: `${((step + 1) / 5) * 100}%` }} />
        </div>
        <span>
          0{step + 1} <span className="muted">/ 05</span>
        </span>
      </div>
      <div className="onboard-heading">
        <Bee size={76} happy />
        <span className="eyebrow">LET’S MAKE THIS PERSONAL</span>
        <h1>{headings[step]}</h1>
        <p>{subheads[step]}</p>
      </div>
      {step < 2 && (
        <>
          {saving && <LoadingScreen label="Saving your profile…" />}
          <div className="selection-counter">
            <span>
              <Check size={15} />
              {selected.length} of 5 selected
            </span>
            <small>You can change these later</small>
          </div>
          <TopicPicker key={key} label={step === 0 ? "interest" : "work trait"} options={step === 0 ? interests : traits} selected={selected} limit={5} onChange={values => setData({...data, [key]: values})} />
        </>
      )}
      {step === 2 && (
        <div className="onboard-form">
          <p>Choose skills you already have. You can skip this.</p>
          <TopicPicker label="skill" options={skillOptions} selected={data.skills ? data.skills.split(", ") : []} limit={10} onChange={values => setData({...data, skills: values.join(", ")})} />
          <label>
            Hours you can give your business each week
            <input
              type="number"
              min="1"
              max="168"
              value={data.hours}
              onChange={(e) =>
                setData({ ...data, hours: Number(e.target.value) })
              }
            />
          </label>
          <div className="soft-note">
            <Lightbulb size={20} />
            Starting small is a strategy. Even a few focused hours can make a
            difference.
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="onboard-form">
          <label>
            Country and city
            <input
              value={data.location}
              onChange={(e) => setData({ ...data, location: e.target.value })}
              placeholder="e.g. Quezon City, Philippines"
              maxLength={200}
            />
          </label>
          <label>
            Currency
            <select
              value={data.currency}
              onChange={(e) => setData({ ...data, currency: e.target.value })}
            >
              {["PHP", "USD", "EUR", "GBP", "SGD"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <div className="form-row">
            <label>
              Available starting capital
              <input
                type="number"
                min="0"
                value={data.capital}
                onChange={(e) =>
                  setData({ ...data, capital: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Monthly budget limit
              <input
                type="number"
                min="0"
                value={data.monthly}
                onChange={(e) =>
                  setData({ ...data, monthly: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <small>
            Zero is a valid starting point. We’ll work with where you are.
          </small>
        </div>
      )}
      {step === 4 && (
        <div className="onboard-form review-profile">
          <h3>Your sparks</h3>
          <div className="chips">
            {data.interests.map((t) => (
              <span className="pill" key={t}>
                {t}
              </span>
            ))}
          </div>
          <h3>Your strengths</h3>
          <div className="chips">
            {data.traits.map((t) => (
              <span className="pill lavender" key={t}>
                {t}
              </span>
            ))}
          </div>
          <p>
            {data.location} · {data.hours} hours/week
          </p>
          <p>
            {data.currency} {data.capital.toLocaleString()} starting capital ·{" "}
            {data.currency} {data.monthly.toLocaleString()}/month budget
          </p>
          <p>
            {data.skills || "A fresh perspective and a willingness to start."}
          </p>
        </div>
      )}
      {Object.entries(profileErrors).map(([key, e]) => (
        <p className="error-text" key={key}>
          {key}: {e.message}
        </p>
      ))}
      {error && (
        <Modal title="We couldn’t complete that" onClose={()=>setError("")}><p>{error}</p><Button onClick={()=>setError("")}>Continue</Button></Modal>
      )}
      <div className="onboard-actions">
        <Button
          variant="secondary"
          onClick={() => (step ? setStep(step - 1) : onExit())}
        >
          <ArrowLeft size={17} />
          Back
        </Button>
        <Button
          disabled={!valid || saving}
          onClick={async () => {
            if (step < 4) setStep(step + 1);
            else {
              setSaving(true);
              setError("");
              try {
                if (await trigger()) await onComplete(getValues());
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setSaving(false);
              }
            }
          }}
        >
          {saving
            ? "Saving…"
            : step === 4
              ? "Find my possibilities"
              : "Continue"}
          <ArrowRight size={17} />
        </Button>
      </div>
    </div>
  );
}
export function Ideas({
  profile,
  isDemo,
  busy,
  createPlan,
  onProfile,
  onOwn,
}: {
  profile: Profile;
  isDemo: boolean;
  busy: boolean;
  createPlan: (n: string, d: string, idea?: string) => void;
  onProfile: () => void;
  onOwn: () => void;
}) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");
  const [note, setNote] = useState("");
  const visible = ideas.filter(i => (i.name + " " + i.description + " " + (i.tags || []).join(" ")).toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "capital" ? (a.capital ?? Infinity) - (b.capital ?? Infinity) : sort === "hours" ? (a.hours ?? Infinity) - (b.hours ?? Infinity) : (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name));
  async function generate() {
    setLoading(true);
    setError("");
    try {
      const next = isDemo ? sampleIdeas(profile) : await api<Idea[]>("/ideas", "POST", { exclude: ideas.map(i => i.name) });
      const fresh = next.filter(i => !ideas.some(old => old.name.toLowerCase() === i.name.toLowerCase()));
      setIdeas(prev => [...prev, ...fresh]);
      setNote(fresh.length ? "" : "No new ideas this time. Try again or update your profile.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      {loading && <LoadingScreen label="Zee is exploring ideas for you…" />}
      <PageHeading
        eyebrow="A WORLD OF WHAT-IFS"
        title="Find your kind of business"
        text="AI ideas, ranked for your interests, skills, budget and time."
      />
      <div className="ideas-banner">
        <Bee size={84} />
        <div>
          <h3>Find your best fit.</h3>
          <p>
            {profile.interests.length === 5
              ? `Let’s explore possibilities around ${profile.interests.slice(0, 3).join(", ")}.`
              : "Tell us what you love so we can find a starting point that fits."}
          </p>
        </div>
        <Button
          disabled={loading || busy || ideas.length >= 60 || (isDemo && ideas.length > 0)}
          onClick={profile.interests.length === 5 ? generate : onProfile}
        >
          {loading
            ? "Finding possibilities…"
            : profile.interests.length === 5
              ? ideas.length
                ? "Show more ideas"
                : "Find ideas"
              : "Build my profile"}
          <Sparkles size={17} />
        </Button>
      </div>
      {isDemo && (
        <p className="helper-text">
          Demo ideas are illustrative templates based on your interests. Sign in
          with a configured Gemini connection for personalized AI
          recommendations.
        </p>
      )}
      {error && (
        <Modal title="We couldn’t complete that" onClose={()=>setError("")}><p>{error}</p><Button onClick={()=>setError("")}>Continue</Button></Modal>
      )}
      {ideas.length > 0 && <>
        <p className="helper-text">{isDemo ? "Sample ideas. Sign in for AI suggestions and ranking." : "Profile fit, not a success prediction. Cost and time are AI estimates."}</p>
        {!isDemo && <details className="soft-note"><summary>How ranking works</summary><p>Interests: 40 points. Skills: 25. Budget: 20. Time: 15. Biz-Z calculates scores from your profile and each idea’s requirements. AI estimates can be wrong.</p></details>}
        <div className="tool-grid">
          <label>Search ideas<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your suggestions" /></label>
          {!isDemo && <label>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="score">Best match</option><option value="capital">Lowest starting cost</option><option value="hours">Fewest weekly hours</option></select></label>}
        </div>
        {!visible.length && <p>No matches. Try another search.</p>}
      </>}
      {note && <p role="status">{note}</p>}
      <div className="ideas-grid">
        {visible.map((idea, i) => (
          <article className="idea-card" key={idea.name}>
            <div className="idea-content idea-content-structured">
              <div className="idea-meta"><span>IDEA {i + 1} · {idea.category || idea.tags?.[0] || "Business idea"}</span><span className="pill">{idea.score === undefined ? "Sample" : idea.score + "/100 fit"}</span></div>
              <h2>{idea.name}</h2>
              <p>{idea.description}</p>
              <h4>Why it fits you</h4>
              <p>{idea.why}</p>
              <div className="idea-estimates">
                <div><span>Estimated startup cost</span><strong>{idea.capital === undefined ? "Not estimated" : new Intl.NumberFormat(undefined, {style: "currency", currency: idea.currency || profile.currency}).format(idea.capital)}</strong></div>
                <div><span>Estimated monthly cost</span><strong>{idea.monthlyCost === undefined ? "Not estimated" : new Intl.NumberFormat(undefined, {style: "currency", currency: idea.currency || profile.currency}).format(idea.monthlyCost)}</strong></div>
                {idea.hours !== undefined && <small>{idea.hours} hours/week</small>}
              </div>
              <h4>Assumptions to check</h4>
              <p>{idea.assumptions || idea.needs}</p>
              <h4>{idea.firstStep ? "Your first step" : "Something to test"}</h4>
              <p>{idea.firstStep || idea.challenge}</p>
              {idea.reasons && <details className="idea-score-details"><summary>Score details</summary><ul>{idea.reasons.map(r => <li key={r}>{r}</li>)}</ul></details>}
              <Button
                disabled={busy}
                onClick={() => createPlan(idea.name, idea.description)}
              >
                Choose this idea <ArrowRight size={16} />
              </Button>
            </div>
          </article>
        ))}
      </div>
      <button className="own-idea" onClick={onOwn}>
        <span className="module-icon color-2">
          <Lightbulb />
        </span>
        <span>
          <strong>Already have that lightbulb moment?</strong>
          <small>Bring your own idea. We’ll help you build the plan.</small>
        </span>
        <Plus size={23} />
      </button>
    </>
  );
}

const skillOptions = [
  ["🍞", "Baking"], ["🍳", "Cooking"], ["🎨", "Graphic design"], ["🎬", "Video editing"],
  ["📷", "Photography"], ["✍️", "Writing"], ["📱", "Social media"], ["💬", "Customer service"],
  ["🛍️", "Selling"], ["🧮", "Bookkeeping"], ["💻", "Coding"], ["🧑‍🏫", "Teaching"],
  ["🧵", "Sewing"], ["🛠️", "Repairs"], ["📅", "Event planning"], ["🌱", "Gardening"],
  ["🐾", "Pet care"], ["📦", "Organizing"],
];
function TopicPicker({label, options, selected, limit, onChange}: {
  label: string; options: string[][]; selected: string[]; limit: number; onChange: (values: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  const [feedback, setFeedback] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const standard = options.map(([,name]) => name.toLowerCase());
  const extras = [...new Set([...added, ...selected])].filter(name => !standard.includes(name.toLowerCase()));
  const choices = [...options, ...extras.map(name => ["✨", name])];
  function toggle(name: string) {
    setFeedback("");
    onChange(selected.includes(name) ? selected.filter(s => s !== name) : selected.length < limit ? [...selected, name] : selected);
  }
  function add() {
    const value = custom.trim().replace(/\s+/g, " ");
    if (!value) { setFeedback("Enter a " + label + "."); return; }
    if (value.includes(",")) { setFeedback("Add one item at a time, without commas."); return; }
    const existing = choices.find(([,name]) => name.toLowerCase() === value.toLowerCase())?.[1];
    if (existing && selected.includes(existing)) { setFeedback("Already selected."); return; }
    if (selected.length >= limit) { setFeedback("Remove a selection before adding another."); return; }
    const name = existing || value;
    if (!existing) setAdded(prev => [...prev, name]);
    onChange([...selected, name]); setCustom(""); setFeedback("");
  }
  return <div className="topic-picker">
    <div className="topic-grid">{choices.map(([emoji,name],i) => <button type="button" key={name} aria-pressed={selected.includes(name)} disabled={!selected.includes(name) && selected.length >= limit} onClick={() => toggle(name)} className={`topic-card topic-color-${i % 5} ${selected.includes(name) ? "selected" : ""}`}>
      <span className="topic-check">{selected.includes(name) && <Check size={15}/>}</span><span className="topic-emoji">{emoji}</span><strong>{name}</strong>
    </button>)}</div>
    <div className="custom-topic"><label>Add your own {label}<input value={custom} maxLength={60} onChange={e => setCustom(e.target.value)} onKeyDown={e => {if(e.key === "Enter") {e.preventDefault();add();}}} placeholder={"Enter a " + label} /></label><Button variant="secondary" onClick={add}>Add</Button></div>
    <p className="helper-text" role="status">{feedback || (label === "skill" ? selected.length + " of " + limit + " selected" : "Custom choices count toward your 5 selections.")}</p>
  </div>;
}
