import beePortrait from "./assets/mascot/bee.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { accountSchema, messageSchema } from "./schemas/forms";
import type { AccountValues, MessageValues } from "./schemas/forms";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  BookOpen,
  Send,
  Sparkles,
} from "lucide-react";
import { LoadingScreen, Bee, Button, Modal, PageHeading } from "./components";
import { api, subtitles } from "./data";
import type { Plan, Profile, Section } from "./data";

export function Editor({
  plan,
  index,
  isDemo,
  aiAvailable,
  onSave,
  onBack,
  onSection,
  notify,
  onDirty,
  onMessages,
  onPlan,
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
  onPlan: (plan: Plan) => void;
  onDirty: (dirty: boolean) => void;
  onMessages: (messages: Plan["messages"]) => void;
}) {
  const [section, setSection] = useState({ ...plan.sections[index] });
  const [messages, setMessages] = useState(plan.messages);
  const {
    register: registerMessage,
    handleSubmit: submitMessage,
    reset: resetMessage,
    formState: { errors: messageErrors },
  } = useForm<MessageValues>({ resolver: zodResolver(messageSchema) });
  const [thinking, setThinking] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState<
    (() => void) | null
  >(null);
  const [decision, setDecision] = useState<{ title: string; text: string; action: () => Promise<unknown> } | null>(null);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const revisions = section.revisions || [];
  const chat = messages.filter((m) => m.section === index);
  const available = !isDemo && aiAvailable;
  const started = useRef(false);
  const [introFailed, setIntroFailed] = useState(false);
  const startInterview = useEffectEvent(() => {
    void ask(
      "Start guiding me through this section. Ask me one short question with useful answer choices.",
    );
  });
  useEffect(() => {
    if (!available || chat.length || section.draft || started.current) return;
    const timer = setTimeout(() => {
      started.current = true;
      startInterview();
    }, 0);
    return () => clearTimeout(timer);
  }, [available, chat.length, section.draft]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function save(reviewed = false, silent = false) {
    setBusy(true);
    setError("");
    try {
      const next: Section = {
        ...section,
        status: reviewed ? "reviewed" : section.status,
      };
      const updated = await onSave(next);
      setSection(updated?.sections[index] || next);
      setDirty(false);
      onDirty(false);
      if (!silent)
        notify(
          reviewed
            ? "Section reviewed."
            : "Your changes are saved.",
        );
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function ask(prompt: string) {
    setIntroFailed(false);
    if (!prompt.trim() || busy || !available) return;
    setBusy(true);
    setThinking(true);
    setError("");
    try {
      if (dirty) {
        await onSave(section);
        setDirty(false);
        onDirty(false);
      }
      const result = await api<{ plan: Plan; options: string[] }>(
        "/plans/" + plan._id + "/sections/" + index + "/zee",
        "POST",
        { message: prompt },
      );
      setSection(result.plan.sections[index]);
      setMessages(result.plan.messages);
      onMessages(result.plan.messages);
      onPlan(result.plan);
      setOptions(result.options);
      resetMessage();
      // The server already persisted the draft. Sync the parent without a second write.
    } catch (e) {
      setError((e as Error).message);
      if (!chat.length) setIntroFailed(true);
    } finally {
      setBusy(false);
      setThinking(false);
    }
  }
  async function leave(action: () => void) {
    if (busy) return;
    setPendingNavigation(() => action);
  }
  const typing = (
    <div className="zee-typing" role="status" aria-label="Zee is thinking">
      <span>Zee</span>
      <span className="zee-typing-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="sr-only">is thinking</span>
    </div>
  );
  const composer = (revision: boolean) => (
    <div className="zee-composer">
      <div className="prompt-chips">
        {(revision
          ? [
              "Make it more concise",
              "Use simpler language",
              "Make it more specific to my business",
            ]
          : options
        ).map((option) => (
          <button
            key={option}
            disabled={busy || !available}
            onClick={() => ask(option)}
          >
            {option}
          </button>
        ))}
        {!revision && chat.length > 0 && (
          <button
            disabled={busy || !available}
            onClick={() =>
              ask(
                "Draft this section now using what you know. Label anything uncertain.",
              )
            }
          >
            Suggest a draft
          </button>
        )}
      </div>
      {thinking && revision && typing}
      <form onSubmit={submitMessage(({ message }) => ask(message))}>
        <label htmlFor="zee-answer">
          {revision ? "What would you like Zee to change?" : "Your answer"}
        </label>
        <textarea
          id="zee-answer"
          {...registerMessage("message")}
          maxLength={4000}
          disabled={busy || !available}
          placeholder={
            revision
              ? "For example: focus on affordable care for first-time pet owners…"
              : "A few words are enough. You can also say you’re not sure."
          }
        />
        {messageErrors.message && (
          <p className="error-text">{messageErrors.message.message}</p>
        )}
        <Button type="submit" disabled={busy || !available}>
          {busy
            ? "Zee is thinking…"
            : revision
              ? "Update my draft"
              : "Send to Zee"}
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
  return (
    <>
      {busy && !thinking && <LoadingScreen label="Saving your section…" />}
      <button
        className="text-button mb-5"
        disabled={busy}
        onClick={() => leave(onBack)}
      >
        <ArrowLeft size={16} />
        Back to my journey
      </button>
      <PageHeading
        eyebrow={"PART " + (index + 1) + " OF 8 · " + plan.name}
        title={section.title}
        text={subtitles[index]}
      />
      {pendingNavigation && (
        <Modal
          title="Ready to move on?"
          onClose={() => setPendingNavigation(null)}
        >
          <p>
            {dirty
              ? "Save your edits before continuing?"
              : "Your saved draft and conversation will be here when you return."}
          </p>
          <div className="editor-actions">
            <Button
              variant="secondary"
              onClick={() => setPendingNavigation(null)}
            >
              Stay here
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                const action = pendingNavigation;
                if (!dirty || (await save(false, true))) {
                  setPendingNavigation(null);
                  action();
                }
              }}
            >
              {dirty ? "Save and continue" : "Continue"}
            </Button>
          </div>
        </Modal>
      )}
      {historyIndex !== null && revisions[historyIndex] && (
        <Modal
          title="Draft version history"
          onClose={() => setHistoryIndex(null)}
        >
          <p>
            Version {historyIndex + 1} of {revisions.length} ·{" "}
            {revisions[historyIndex].source} ·{" "}
            {new Date(revisions[historyIndex].createdAt).toLocaleString()}
          </p>
          <div className="revision-preview">
            {revisions[historyIndex].draft || "Empty draft"}
          </div>
          <p>
            Restoring adds a version and keeps earlier ones. Review the restored draft.
          </p>
          <div className="editor-actions">
            <Button
              variant="secondary"
              disabled={historyIndex === 0 || busy}
              onClick={() => setHistoryIndex(historyIndex - 1)}
            >
              Earlier
            </Button>
            <Button
              variant="secondary"
              disabled={historyIndex === revisions.length - 1 || busy}
              onClick={() => setHistoryIndex(historyIndex + 1)}
            >
              Later
            </Button>
            <Button
              disabled={busy}
              onClick={() => setDecision({ title: "Restore this version?", text: dirty ? "Unsaved edits will be replaced. Saved versions are kept." : "This becomes your current draft. Saved versions are kept.", action: async () => {
                setBusy(true);
                try {
                  const updated = await onSave({
                    ...section,
                    draft: revisions[historyIndex].draft,
                    status: "draft",
                  });
                  setSection(
                    updated?.sections[index] || {
                      ...section,
                      draft: revisions[historyIndex].draft,
                      status: "draft",
                    },
                  );
                  setDirty(false);
                  onDirty(false);
                  setHistoryIndex(null);
                  notify(
                    "Earlier version restored. Your other versions are still available.",
                  );
                } catch (e) {
                  setHistoryIndex(null);
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              } })}
            >
              Restore this version
            </Button>
          </div>
        </Modal>
      )}
      {decision && (
        <Modal title={decision.title} onClose={() => setDecision(null)}>
          <p>{decision.text}</p>
          <div className="editor-actions">
            <Button variant="secondary" onClick={() => setDecision(null)}>Cancel</Button>
            <Button disabled={busy} onClick={() => { const action = decision.action; setDecision(null); void action(); }}>Confirm</Button>
          </div>
        </Modal>
      )}
      <div className="zee-workspace" aria-busy={busy}>
        <section className="zee-interview">
          <div className="zee-host">
            <img src={beePortrait} alt="Zee" width={96} height={96} style={{ objectFit: "contain", flexShrink: 0 }} />
            <div>
              <span className="eyebrow">LET’S BUILD THIS TOGETHER</span>
              <h2>Let’s build this section.</h2>
              <p>
                Answer a few questions. I’ll draft your {section.title.toLowerCase()}.
              </p>
            </div>
          </div>
          {!available && (
            <p className="soft-note">
              {isDemo
                ? "Sign in to use Zee, or edit your draft below."
                : "Zee is unavailable. You can still edit below."}
            </p>
          )}
          {chat.length === 0 && introFailed && (
            <Button
              disabled={busy || !available}
              onClick={() =>
                ask(
                  "Start guiding me through this section. Ask me one short question with useful answer choices.",
                )
              }
            >
              <Sparkles size={17} />
              Retry Zee’s introduction
            </Button>
          )}
          <div className="zee-transcript" aria-live="polite">
            {chat.map((m) => (
              <div
                key={m._id}
                className={
                  m.role === "user" ? "user-message" : "assistant-message"
                }
              >
                <strong>{m.role === "user" ? "You" : "Zee"}</strong>
                <p>{m.text}</p>
              </div>
            ))}
            {thinking && !section.draft && typing}
          </div>
          {!section.draft && chat.length > 0 && composer(false)}
        </section>
        <section className="zee-draft">
          <span className="eyebrow">YOUR IDEAS, PUT INTO WORDS</span>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2>Your {section.title.toLowerCase()} draft</h2>
            <Button
              variant="secondary"
              disabled={busy || !revisions.length}
              onClick={() => setHistoryIndex(revisions.length - 1)}
            >
              Version history ({revisions.length})
            </Button>
          </div>
          {section.draft ? (
            <>
              <div className="zee-essay" style={{ whiteSpace: 'pre-wrap' }}>
                {section.draft}
              </div>
              <p className="zee-save-note">
                {dirty ? "You have unsaved edits." : "Saved to this section."}{" "}
                Check details before marking reviewed.
              </p>
            </>
          ) : (
            <div className="zee-draft-empty">
              <Sparkles size={26} />
              <p>
                Your draft will appear here after the chat.
              </p>
            </div>
          )}
          {section.draft && available && composer(true)}
          <details className="zee-manual">
            <summary>Edit manually</summary>
            <textarea
              aria-label="Edit section draft"
              value={section.draft}
              maxLength={30000}
              disabled={busy}
              onChange={(e) => {
                setSection({
                  ...section,
                  draft: e.target.value,
                  status: "draft",
                });
                setDirty(true);
                onDirty(true);
              }}
            />
          </details>
          {error && (
            <Modal
              title="We couldn’t complete that"
              onClose={() => setError("")}
            >
              <p>{error}</p>
              <Button onClick={() => setError("")}>Back to my draft</Button>
            </Modal>
          )}
          <div className="editor-actions">
            <span>
              {section.status === "reviewed"
                ? "✓ Reviewed"
                : "Ready to review?"}
            </span>
            <Button
              variant="secondary"
              disabled={busy || !dirty}
              onClick={() => save()}
            >
              Save edits
            </Button>
            <Button
              disabled={busy || !section.draft.trim()}
              onClick={() => setDecision({ title: "Mark as reviewed?", text: "Confirm that you checked the draft and its assumptions.", action: () => save(true) })}
            >
              Mark reviewed
              <Check size={16} />
            </Button>
          </div>
          <div className="section-pagination">
            <button
              disabled={busy || index === 0}
              onClick={() => leave(() => onSection(index - 1))}
            >
              <ArrowLeft size={16} />
              Previous
            </button>
            <button
              disabled={busy || index === 7}
              onClick={() => leave(() => onSection(index + 1))}
            >
              Next section
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
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
  const [exporting,setExporting]=useState(false);
  const [exportError,setExportError]=useState("");
  const reviewed = plan.sections.filter((s) => s.status === "reviewed").length;
  async function download() {
    setExporting(true);
    try {
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
    } catch {setExportError("The PDF could not be created. Your saved plan is safe. Please try again.");} finally {setExporting(false);}
  }
  return (
    <>
      {exporting&&<LoadingScreen label="Preparing your business plan…"/>}
      {exportError&&<Modal title="Export unavailable" onClose={()=>setExportError("")}><p>{exportError}</p><Button onClick={()=>setExportError("")}>Back to my plan</Button></Modal>}
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
  const {
    register,
    handleSubmit,
    setError: fieldError,
    formState: { errors },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", email: "", password: "" },
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      title={
        mode === "register"
          ? "Create your account"
          : "Welcome back, builder"
      }
      onClose={onClose}
    >
      <p>
        {mode === "register"
          ? "Create an account to save your plans."
          : "Sign in to continue."}
      </p>
      {busy && <LoadingScreen label="Opening your workspace…" />}
      <form
        noValidate
        onSubmit={handleSubmit(async ({ name, email, password }) => {
          if (mode === "register" && !name.trim()) {
            fieldError("name", { message: "Enter your name" });
            return;
          }
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
        })}
      >
        {mode === "register" && (
          <label>
            Your name
            <input
              autoFocus
              required
              {...register("name")}
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
            {...register("email")}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            required
            type={showPassword ? "text" : "password"}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
            onPaste={e => e.preventDefault()}
            onDrop={e => e.preventDefault()}
            minLength={8}
            maxLength={100}
            {...register("password")}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
          />
          <button type="button" className="password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>} {showPassword ? "Hide password" : "Show password"}</button>
          {mode === "register" && <small>At least 8 characters</small>}
        </label>
        {Object.entries(errors).map(([key, e]) => (
          <p className="error-text" key={key}>
            {key}: {e.message}
          </p>
        ))}
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
          setShowPassword(false);
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
