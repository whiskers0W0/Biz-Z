import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  BookOpen,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Bee, Button, Modal, PageHeading } from "./components";
import { api, questions, subtitles } from "./data";
import type { Plan, Profile, Section } from "./data";
export function Editor({
  plan,
  index,
  profile,
  isDemo,
  aiAvailable,
  onSave,
  onBack,
  onSection,
  notify,
  onDirty,
  onMessages,
}: {
  plan: Plan;
  index: number;
  profile: Profile;
  isDemo: boolean;
  aiAvailable: boolean;
  onSave: (s: Section) => Promise<Plan | undefined>;
  onBack: () => void;
  onSection: (i: number) => void;
  notify: (s: string) => void;
  onDirty: (dirty: boolean) => void;
  onMessages: (messages: Plan["messages"]) => void;
}) {
  const [section, setSection] = useState<Section>({
    ...plan.sections[index],
    answers: [...plan.sections[index].answers],
  });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [asking, setAsking] = useState(false);
  const [chat, setChat] = useState(plan.messages.slice(-8));
  const [finance, setFinance] = useState({
    price: 0,
    units: 0,
    variable: 0,
    fixed: 0,
  });
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function change(next: Section) {
    setSection({ ...next, status: next.draft ? "draft" : "not-started" });
    setDirty(true);
    onDirty(true);
  }
  async function save(reviewed = false) {
    setSaving(true);
    try {
      const next = {
        ...section,
        status: reviewed ? ("reviewed" as const) : section.status,
      };
      await onSave(next);
      setSection(next);
      setDirty(false);
      onDirty(false);
      notify(
        reviewed
          ? "A little win! This section is reviewed."
          : "Your draft is saved.",
      );
      return true;
    } catch (e) {
      notify((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }
  async function ask(prompt: string) {
    if (!prompt.trim()) return;
    if (isDemo || !aiAvailable) {
      notify(
        "Zee’s AI needs an account and a configured Gemini connection. You can keep building with the questions and draft editor.",
      );
      return;
    }
    setAsking(true);
    try {
      if (dirty && !(await save())) return;
      const result = await api<{ text: string }>(
        `/plans/${plan._id}/chat`,
        "POST",
        { message: prompt, section: index },
      );
      const messages = [
        ...chat,
        { role: "user", text: prompt },
        { role: "assistant", text: result.text },
      ];
      setChat(messages);
      onMessages(messages);
      setReply(result.text);
      setMessage("");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setAsking(false);
    }
  }
  async function leave(action: () => void) {
    if (!dirty || (await save())) action();
  }
  const revenue = finance.price * finance.units,
    expenses = finance.variable * finance.units + finance.fixed;
  return (
    <>
      <button className="text-button mb-5" onClick={() => leave(onBack)}>
        <ArrowLeft size={16} />
        Back to my journey
      </button>
      <PageHeading
        eyebrow={`STEP 0${index + 1} OF 08 · ${plan.name.toUpperCase()}`}
        title={section.title}
        text={subtitles[index]}
      />
      <div className="editor-layout">
        <section className="editor-card" aria-busy={saving} inert={saving}>
          <div className="editor-intro">
            <span className="module-icon color-0">🌱</span>
            <div>
              <h3>A few thoughts to get you started</h3>
              <p>Rough ideas are welcome. You can polish them as you go.</p>
            </div>
          </div>
          {questions[index].map((q, i) => (
            <label key={q}>
              {q}
              <textarea
                value={section.answers[i] || ""}
                onChange={(e) => {
                  const answers = [...section.answers];
                  answers[i] = e.target.value;
                  change({ ...section, answers });
                }}
                placeholder="Start with what you know…"
                maxLength={10000}
              />
            </label>
          ))}
          {index === 5 && (
            <div className="finance-calculator">
              <h3>A quick monthly estimate</h3>
              <p>
                These are working assumptions, not forecasts. Currency:{" "}
                {profile.currency}.
              </p>
              <div className="form-row">
                {(["price", "units", "variable", "fixed"] as const).map(
                  (key, i) => (
                    <label key={key}>
                      {
                        [
                          "Price per sale",
                          "Sales per month",
                          "Variable cost per sale",
                          "Fixed monthly costs",
                        ][i]
                      }
                      <input
                        type="number"
                        min="0"
                        value={finance[key]}
                        onChange={(e) =>
                          setFinance({
                            ...finance,
                            [key]: Math.max(0, Number(e.target.value)),
                          })
                        }
                      />
                    </label>
                  ),
                )}
              </div>
              <p>
                Revenue: <strong>{revenue.toLocaleString()}</strong> · Expenses:{" "}
                <strong>{expenses.toLocaleString()}</strong> · Operating profit:{" "}
                <strong>{(revenue - expenses).toLocaleString()}</strong>
              </p>
              <Button
                variant="secondary"
                onClick={() =>
                  change({
                    ...section,
                    draft: `${section.draft}\n\nMonthly working assumptions (${profile.currency}): price ${finance.price}, sales ${finance.units}, variable cost per sale ${finance.variable}, fixed costs ${finance.fixed}. Estimated revenue ${revenue}; expenses ${expenses}; operating profit ${revenue - expenses}. Excludes taxes and financing costs.`,
                  })
                }
              >
                Add estimate to draft <Plus size={15} />
              </Button>
            </div>
          )}
          {index === 7 && (
            <div className="soft-note">
              <ShieldCheck size={22} />
              Use this section to record requirements and official source links
              for your location. AI suggestions need verification.
            </div>
          )}
          <div className="draft-heading">
            <h3>Your section draft</h3>
            <button
              className="text-button"
              onClick={() =>
                change({
                  ...section,
                  draft: section.answers.filter(Boolean).join("\n\n"),
                })
              }
            >
              Use my answers <ArrowRight size={14} />
            </button>
          </div>
          <textarea
            aria-label="Your section draft"
            className="draft-editor"
            value={section.draft}
            onChange={(e) => change({ ...section, draft: e.target.value })}
            placeholder="Your business plan takes shape here. Write freely, use your answers above, or ask Zee for a suggestion."
            maxLength={30000}
          />
          <div className="editor-actions">
            <span className="save-status">
              {dirty
                ? "Unsaved changes"
                : section.status === "reviewed"
                  ? "✓ Reviewed"
                  : "✓ Up to date"}
            </span>
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => save()}
            >
              {saving ? "Saving…" : "Save draft"}
            </Button>
            <Button
              disabled={saving || !section.draft.trim()}
              onClick={() => save(true)}
            >
              Mark reviewed <Check size={17} />
            </Button>
          </div>
          <div className="section-pagination">
            <button
              disabled={index === 0}
              onClick={() => leave(() => onSection(index - 1))}
            >
              <ArrowLeft size={15} />
              Previous
            </button>
            <button
              disabled={index === 7}
              onClick={() => leave(() => onSection(index + 1))}
            >
              Next section
              <ArrowRight size={15} />
            </button>
          </div>
        </section>
        <aside className="chat-panel">
          <div className="zee-top">
            <Bee size={52} />
            <div>
              <h3>A little help from Zee</h3>
              <span>
                {isDemo || !aiAvailable
                  ? "Guidance, at your pace"
                  : "Powered by Gemini"}
              </span>
            </div>
          </div>
          <div className="chat-body">
            <div className="assistant-message">
              Let’s make this feel less like a blank page. Tell me what’s on
              your mind, or pick a starting point below.
            </div>
            <div className="prompt-chips">
              {[
                "Explain this section",
                "Help me brainstorm",
                "Draft from my answers",
              ].map((p) => (
                <button key={p} disabled={asking} onClick={() => ask(p)}>
                  <Sparkles size={13} />
                  {p}
                </button>
              ))}
            </div>
            {chat.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user" ? "user-message" : "assistant-message"
                }
              >
                {m.text}
              </div>
            ))}
            {asking && (
              <div className="assistant-message" role="status">
                Zee is thinking…
              </div>
            )}
            {reply && (
              <Button
                variant="secondary"
                onClick={() => {
                  change({
                    ...section,
                    draft: section.draft
                      ? section.draft + "\n\n" + reply
                      : reply,
                  });
                  setReply("");
                  notify(
                    "Suggestion added to your draft. Review and save when ready.",
                  );
                }}
              >
                Add suggestion to draft <Plus size={14} />
              </Button>
            )}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              ask(message);
            }}
          >
            <input
              aria-label="Message Zee"
              placeholder="Ask Zee about your plan…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
            />
            <button
              disabled={asking || !message.trim()}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </form>
          <small className="chat-disclaimer">
            {isDemo || !aiAvailable
              ? "AI requires an account and a server Gemini key."
              : "A thinking partner. Always review suggestions."}
          </small>
        </aside>
      </div>
    </>
  );
}
export function Review({
  plan,
  onBack,
  onEdit,
}: {
  plan: Plan;
  onBack: () => void;
  onEdit: (i: number) => void;
}) {
  const reviewed = plan.sections.filter((s) => s.status === "reviewed").length;
  async function download() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 25;
    function write(text: string, size: number) {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 170);
      for (const line of lines) {
        if (y > 275) {
          doc.addPage();
          y = 22;
        }
        doc.text(line, 20, y);
        y += size * 0.5 + 2;
      }
      y += 5;
    }
    write("Biz-Z | Business plan", 12);
    write(plan.name, 24);
    write(
      `${reviewed}/8 sections reviewed | ${new Date().toLocaleDateString()}`,
      10,
    );
    write(plan.description, 11);
    plan.sections.forEach((s, i) => {
      write(`${i + 1}. ${s.title} [${s.status}]`, 16);
      write(s.draft || "Not drafted yet.", 11);
    });
    doc.save(`${plan.name.replace(/[^a-z0-9]/gi, "-")}-business-plan.pdf`);
  }
  return (
    <>
      <button className="text-button mb-5" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to my journey
      </button>
      <PageHeading
        eyebrow="LOOK WHAT YOU’RE BUILDING"
        title={plan.name}
        text={`${reviewed} of 8 sections reviewed. Your whole idea, coming together.`}
      />
      <div className="review-toolbar">
        <span>
          <BookOpen size={18} />
          {reviewed === 8
            ? "Ready for your next move"
            : "Work in progress · export available anytime"}
        </span>
        <Button onClick={download}>
          <Download size={17} />
          Download PDF
        </Button>
      </div>
      <div className="review-document">
        <div className="document-cover">
          <span className="eyebrow">A BUSINESS PLAN BY YOU</span>
          <h1>{plan.name}</h1>
          <p>{plan.description}</p>
          <Bee size={100} happy />
        </div>
        {plan.sections.map((s, i) => (
          <section key={s.title}>
            <div className="flex justify-between gap-3 items-center">
              <h2>
                <span className="yellow-text">0{i + 1}.</span> {s.title}
              </h2>
              <button className="text-button" onClick={() => onEdit(i)}>
                Edit <ChevronRight size={15} />
              </button>
            </div>
            <span className="document-status">
              {s.status.replace("-", " ")}
            </span>
            <p className="whitespace-pre-wrap">
              {s.draft ||
                "Your story is still taking shape. Add a draft in this section to see it here."}
            </p>
          </section>
        ))}
      </div>
    </>
  );
}
export type User = {
  id: string;
  name: string;
  email: string;
  profile: Profile;
};
export function AuthModal({
  mode,
  setMode,
  onClose,
  onSuccess,
}: {
  mode: "login" | "register";
  setMode: (m: "login" | "register") => void;
  onClose: () => void;
  onSuccess: (u: User) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={
        mode === "register"
          ? "Your next chapter starts here"
          : "Welcome back, builder"
      }
      onClose={onClose}
    >
      <p>
        {mode === "register"
          ? "Create an account to keep your plans in your personal workspace."
          : "A little progress is waiting for you."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const u = await api<User>(`/auth/${mode}`, "POST", {
              ...(mode === "register" ? { name } : {}),
              email,
              password,
            });
            await onSuccess(u);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "register" && (
          <label>
            Your name
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              autoComplete="name"
            />
          </label>
        )}
        <label>
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            minLength={8}
            maxLength={100}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
          />
          <small>At least 8 characters</small>
        </label>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy
            ? "One moment…"
            : mode === "register"
              ? "Create my account"
              : "Sign in"}
          <ArrowRight size={17} />
        </Button>
      </form>
      <button
        className="text-button mt-5"
        onClick={() => {
          setError("");
          setMode(mode === "register" ? "login" : "register");
        }}
      >
        {mode === "register"
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </Modal>
  );
}
