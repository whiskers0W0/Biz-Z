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
import { Bee, Button, PageHeading } from "./components";
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
  const [data, setData] = useState<Profile>({ ...profile });
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
    "Pick 5 things you could happily talk about for hours.",
    "Pick 5 traits that describe how you like to work.",
    "A little experience, a little curiosity. It all counts.",
    "A few practical details help keep your ideas grounded.",
    "Here’s the starting point for your next big thing.",
  ];
  const options = step === 0 ? interests : traits;
  const key = step === 0 ? "interests" : "traits";
  const selected = data[key];
  function toggle(value: string) {
    setData((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : prev[key].length < 5
          ? [...prev[key], value]
          : prev[key],
    }));
  }
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
          <div className="selection-counter">
            <span>
              <Check size={15} />
              {selected.length} of 5 selected
            </span>
            <small>You can change these later</small>
          </div>
          <div className="topic-grid">
            {options.map(([emoji, label], i) => (
              <button
                aria-pressed={selected.includes(label)}
                key={label}
                onClick={() => toggle(label)}
                disabled={!selected.includes(label) && selected.length >= 5}
                className={`topic-card topic-color-${i % 5} ${selected.includes(label) ? "selected" : ""}`}
              >
                <span className="topic-check">
                  {selected.includes(label) && <Check size={15} />}
                </span>
                <span className="topic-emoji">{emoji}</span>
                <strong>{label}</strong>
              </button>
            ))}
          </div>
        </>
      )}
      {step === 2 && (
        <div className="onboard-form">
          <label>
            What skills or experience would you like to build on?
            <textarea
              value={data.skills}
              onChange={(e) => setData({ ...data, skills: e.target.value })}
              placeholder="Maybe you bake for friends, make videos, organize events, or simply love learning…"
              maxLength={2000}
            />
          </label>
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
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
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
                await onComplete(data);
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
  createPlan: (n: string, d: string) => void;
  onProfile: () => void;
  onOwn: () => void;
}) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function generate() {
    setLoading(true);
    setError("");
    try {
      setIdeas(
        isDemo ? sampleIdeas(profile) : await api<Idea[]>("/ideas", "POST"),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="A WORLD OF WHAT-IFS"
        title="Find your kind of business"
        text="Start with something that sparks your curiosity. Make it yours along the way."
      />
      <div className="ideas-banner">
        <Bee size={84} />
        <div>
          <h3>Good businesses start with a little curiosity.</h3>
          <p>
            {profile.interests.length === 5
              ? `Let’s explore possibilities around ${profile.interests.slice(0, 3).join(", ")}.`
              : "Tell us what you love so we can find a starting point that fits."}
          </p>
        </div>
        <Button
          disabled={loading || busy}
          onClick={profile.interests.length === 5 ? generate : onProfile}
        >
          {loading
            ? "Finding possibilities…"
            : profile.interests.length === 5
              ? ideas.length
                ? "Explore again"
                : "Explore 3 ideas"
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
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="ideas-grid">
        {ideas.map((idea, i) => (
          <article className="idea-card" key={idea.name}>
            <div className={`idea-art topic-color-${i}`}>
              <span>{["🎨", "🛍️", "🌻"][i]}</span>
              <span className="pill white-pill">POSSIBILITY 0{i + 1}</span>
            </div>
            <div className="idea-content">
              <h2>{idea.name}</h2>
              <p>{idea.description}</p>
              <h4>Why it could fit</h4>
              <p>{idea.why}</p>
              <h4>What you’ll need</h4>
              <p>{idea.needs}</p>
              <h4>Something to test</h4>
              <p>{idea.challenge}</p>
              <Button
                disabled={busy}
                onClick={() => createPlan(idea.name, idea.description)}
              >
                Build this idea <ArrowRight size={16} />
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
