import { LocationPicker } from "./LocationPicker";
import { LocalCompetition } from "./LocalCompetition";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileFormSchema } from "./schemas/forms";
import type { ProfileValues } from "./schemas/forms";

import { useState, useEffect, useEffectEvent, useRef } from "react";
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
    "How do you like to work?",
    "Let’s find your starting point.",
    "Yep, this looks like you.",
  ];
  const subheads = [
    "Choose 5 interests.",
    "Choose 5 personality traits.",
    "Choose up to 5 work preferences and set your time.",
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
          <TopicPicker key={key} label={step === 0 ? "interests" : "personality traits"} options={step === 0 ? interests : traits} selected={selected} limit={5} onChange={values => setData({...data, [key]: values})} />
        </>
      )}
      {step === 2 && (
        <div className="onboard-form work-preferences">
          <p>Pick the ways of working that suit you.</p>
          <TopicPicker label="work preferences" options={workOptions} selected={data.workStyles || []} limit={5} onChange={values => setData({...data, workStyles: values})} />
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
          <LocationPicker value={data.location} point={data.locationPoint} onChange={(location, locationPoint) => setData({...data, location, locationPoint})} />
          <label>
            Currency
            <select
              value={data.currency}
              onChange={(e) => setData({ ...data, currency: e.target.value })}
            >
              {["PHP", "USD", "EUR", "GBP", "SGD", "AUD", "CAD", "NZD", "HKD", "CNY", "JPY", "KRW", "INR", "MYR", "THB", "IDR", "VND", "AED", "SAR", "CHF"].map((c) => (
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
          <h3>Your personality</h3>
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
          <h3>Your working style</h3><div className="chips">{data.workStyles?.length ? data.workStyles.map(t=><span className="pill lavender" key={t}>{t}</span>) : <p>No work preferences selected.</p>}</div>
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
  const started = useRef(false);
  const startGeneration = useEffectEvent(() => { void generate(); });
  useEffect(() => {
    if (profile.interests.length !== 5 || started.current) return;
    const timer = setTimeout(() => { started.current = true; startGeneration(); }, 0);
    return () => clearTimeout(timer);
  }, [profile.interests.length]);
  return (
    <>
      <PageHeading
        eyebrow="A WORLD OF WHAT-IFS"
        title="Find your kind of business"
        text="AI ideas, ranked for your interests, work preferences, budget and time."
      />
      <div className="ideas-banner">
        <Bee size={84} />
        <div>
          <h3>{loading ? "Zee is finding your matches…" : ideas.length ? "Ideas for you" : "Find your best fit"}</h3>
          <p>
            {profile.interests.length === 5
              ? "Based on your Interests, Personality, and Location."
              : "Tell us what you love so we can find a starting point that fits."}
          </p>
          {loading && <div className="idea-loading-track" role="progressbar" aria-label="Finding business ideas"><span /></div>}
        </div>
        {!loading && <Button
          disabled={busy || ideas.length >= 60 || (isDemo && ideas.length > 0)}
          onClick={profile.interests.length === 5 ? generate : onProfile}
        >
          {loading
            ? "Finding possibilities…"
            : profile.interests.length === 5
              ? ideas.length
                ? "Show more ideas"
                : "Try again"
              : "Build my profile"}
          <Sparkles size={17} />
        </Button>}
      </div>
      {isDemo && (
        <p className="helper-text">
          Sample ideas. Sign in for personalized suggestions.
        </p>
      )}
      {error && (
        <Modal title="We couldn’t complete that" onClose={()=>setError("")}><p>{error}</p><Button onClick={()=>setError("")}>Continue</Button></Modal>
      )}
      {ideas.length > 0 && <>
        <p className="helper-text">{isDemo ? "Sample ideas. Sign in for AI suggestions and ranking." : "Profile fit, not a success prediction. Cost and time are AI estimates."}</p>
        {!isDemo && <details className="soft-note"><summary>How ranking works</summary><p>Interests: 40 points. Work preferences: 25. Budget: 20. Time: 15. Biz-Z calculates scores from your profile and each idea’s requirements. AI estimates can be wrong.</p></details>}
        <div className="tool-grid">
          <label>Search ideas<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your suggestions" /></label>
          {!isDemo && <label>Sort by<select value={sort} onChange={e => setSort(e.target.value)}><option value="score">Best match</option><option value="capital">Lowest starting cost</option><option value="hours">Fewest weekly hours</option></select></label>}
        </div>
        {!visible.length && <p>No matches. Try another search.</p>}
      </>}
      {note && <p role="status">{note}</p>}
      <div className="ideas-grid">
        {visible.map((idea, i) => (
          <article className={"idea-card " + (ideas.slice().sort((a,b)=>(b.score || 0)-(a.score || 0) || a.name.localeCompare(b.name)).findIndex(v=>v.name===idea.name)<3 ? "top-idea" : "")} key={idea.name}>
            <div className="idea-content idea-content-structured">
              <div className="idea-meta"><span>IDEA {i + 1} · {idea.category || idea.tags?.[0] || "Business idea"}</span><span className="pill">{idea.score === undefined ? "Sample" : idea.score + "/100 fit"}</span></div>
              {idea.score !== undefined && ideas.slice().sort((a,b)=>(b.score || 0)-(a.score || 0) || a.name.localeCompare(b.name)).findIndex(v=>v.name===idea.name)<3 && <span className="rank-badge">Top {ideas.slice().sort((a,b)=>(b.score || 0)-(a.score || 0) || a.name.localeCompare(b.name)).findIndex(v=>v.name===idea.name)+1} match</span>}<h2>{idea.name}</h2>
              <p>{idea.description}</p>
              <h4>Why it fits you</h4>
              <p>{idea.why}</p>
              <div className="idea-estimates">
                <div><span>Estimated startup cost</span><strong>{idea.capital === undefined ? "Not estimated" : new Intl.NumberFormat(undefined, {style: "currency", currency: idea.currency || profile.currency}).format(idea.capital)}</strong></div>
                <div><span>Estimated monthly cost</span><strong>{idea.monthlyCost === undefined ? "Not estimated" : new Intl.NumberFormat(undefined, {style: "currency", currency: idea.currency || profile.currency}).format(idea.monthlyCost)}</strong></div>
                {idea.hours !== undefined && <small>{idea.hours} hours/week</small>}
              </div>
              {idea.locationFit && <><h4>Why this location</h4><p>{idea.locationFit}</p></>}
              <LocalCompetition idea={idea} profile={profile}/>
              <h4>Assumptions to check</h4>
              <p>{idea.assumptions || idea.needs}</p>
              <h4>{idea.firstStep ? "Your first step" : "Something to test"}</h4>
              <p>{idea.firstStep || idea.challenge}</p>

              <Button
                disabled={busy}
                onClick={() => createPlan("Untitled business", idea.description)}
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

const workOptions = [
 ["🚩", "Enjoy leading"], ["💜", "Enjoy supporting"], ["🤝", "Face-to-face work"], ["⏱️", "Fixed schedule"],
 ["🏠", "From home"], ["🏢", "At a workplace"], ["🌳", "Outdoors"], ["🚶", "On the move"],
 ["👤", "Working solo"], ["🤝", "With a small team"], ["👥", "With customers"], ["💻", "Online"],
 ["🛠️", "Hands-on tasks"], ["🎨", "Creative projects"], ["🔍", "Research & analysis"], ["📋", "Planning & organizing"],
 ["🕘", "A steady routine"], ["⏰", "Flexible hours"], ["⚡", "A fast pace"], ["🌿", "A calm pace"],
 ["📦", "Making products"], ["💬", "Offering services"], ["🎓", "Teaching others"], ["🧩", "Solving problems"],
 ["📅", "Project-based work"], ["🔄", "Varied daily tasks"], ["📝", "Clear instructions"], ["🧭", "Setting my own direction"],
];
function TopicPicker({label, options, selected, limit, onChange}: {
 label: string; options: string[][]; selected: string[]; limit: number; onChange: (values: string[]) => void;
}) {
 // Preserve earlier saved choices so users can remove or retain them.
 const extras = selected.filter(name => !options.some(([, value]) => value === name));
 const choices = [...options, ...extras.map(name => ["✨", name])];
 return <div className="topic-picker" role="group" aria-label={label}>
 <div className="topic-grid">{choices.map(([emoji,name],i) => <button type="button" key={name} aria-pressed={selected.includes(name)} disabled={!selected.includes(name) && selected.length >= limit} onClick={() => onChange(selected.includes(name) ? selected.filter(s => s !== name) : [...selected,name])} className={`topic-card topic-color-${i % 5} ${selected.includes(name) ? "selected" : ""}`}>
 <span className="topic-check">{selected.includes(name) && <Check size={15}/>}</span><span className="topic-emoji">{emoji}</span><strong>{name}</strong>
 </button>)}</div><p className="helper-text" role="status">{selected.length} of {limit} selected</p></div>;
}
