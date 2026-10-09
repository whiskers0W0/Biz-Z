import { FormalDraft } from "./FormalDraft";
import { documentBlocks } from "./documentBlocks";
import beePortrait from "./assets/mascot/bee.png";
import { NextSteps } from "./NextSteps";
import { DraftChanges } from "./DraftChanges";
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
  Pencil,
} from "lucide-react";
import { LoadingScreen, Bee, Button, Modal, PageHeading } from "./components";
import { api } from "./data";
import type { Plan, Profile, Section } from "./data";

export function Editor({
  plan,
  index,
  isDemo,
  aiAvailable,
  onSave,
  onBack,
  onSection,
  onReview,
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
  onReview: () => void;
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
  const [editing, setEditing] = useState(false);
  const editSnapshot = useRef<Section | null>(null);
  const draftInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (editing) draftInput.current?.focus(); }, [editing]);
  const [chatOpen, setChatOpen] = useState(true);
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
  const transcript = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatOpen && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [chat.length, thinking, chatOpen]);
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
        status: reviewed ? "reviewed" : dirty ? (section.draft.trim() ? "draft" : "not-started") : section.status,
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
    if (!prompt.trim() || busy || editing || !available) return;
    setBusy(true);
    setThinking(true);
    setOptions([]);
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
  async function leave(action: () => void, back = false) {
    if (busy) return;
    if (back && section.status === "reviewed" && !dirty) { action(); return; }
    setPendingNavigation(() => action);
  }
  const typing = (
    <div className="zee-typing" role="status" aria-label="Zee is thinking">
      <span>Zee</span>
      <span className="zee-typing-dots" aria-hidden="true"><i /><i /><i /></span>
      <span className="sr-only">is thinking</span>
    </div>
  );
  const sectionSuggestions = [
    ["Clarify our mission", "Make our goals measurable", "Explain what makes us different"],
    ["Narrow our target customers", "Strengthen the competitor comparison", "Review our SWOT"],
    ["Clarify customer benefits", "Explain how the service works", "Compare our product options"],
    ["Refine our promotion channels", "Improve our pricing approach", "Add ways to retain customers"],
    ["Clarify daily operations", "Define team responsibilities", "Identify supplier needs"],
    ["Break down startup costs", "Check sales assumptions", "Explain the funding gap"],
    ["Highlight the market opportunity", "Summarize financial assumptions", "Sharpen our value proposition"],
    ["List requirements to verify", "Clarify registration steps", "Identify compliance risks"],
  ][index];
  const usedSuggestions = new Set(chat.filter(m=>m.role==="user").map(m=>m.text.trim().toLowerCase()));
  const composer = (revision: boolean) => (
    <div className="zee-composer">
      {!busy && <div className="zee-suggestions"><p className="suggestions-label">{options.length ? "Suggested replies" : revision ? "Refine this section" : ""}</p><div className="prompt-chips">
        {(revision ? (options.length ? options : sectionSuggestions) : options
        ).filter(option=>!usedSuggestions.has(option.trim().toLowerCase())).map((option) => (
          <button
            key={option}
            disabled={busy || editing || !available}
            onClick={() => ask(option)}
          >
            {option}
          </button>
        ))}
        {!revision && chat.length > 0 && (
          <button
            disabled={busy || editing || !available}
            onClick={() =>
              ask(
                "Draft this section now using what you know. Label anything uncertain.",
              )
            }
          >
            Suggest a draft
          </button>
        )}
      </div></div>}

      <form onSubmit={submitMessage(({ message }) => ask(message))}>
        <label htmlFor="zee-answer">
          {revision ? "What should change?" : "Your answer"}
        </label>
        <textarea
          id="zee-answer"
          {...registerMessage("message")}
          maxLength={4000}
          disabled={busy || editing || !available}
          placeholder={
            revision
              ? "Describe your changes…"
              : "Type your answer…"
          }
        />
        {messageErrors.message && (
          <p className="error-text">{messageErrors.message.message}</p>
        )}
        <Button type="submit" disabled={busy || editing || !available}>
          {busy
            ? "Zee is thinking…"
            : revision
              ? "Send to Zee"
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
        onClick={() => leave(onBack, true)}
      >
        <ArrowLeft size={16} />
        Back to plan
      </button>
      <PageHeading
        eyebrow={"PART " + (index + 1) + " OF 8 · " + plan.name}
        title={section.title}
        text={["Your offer, customers, and goals.","Your customers, competitors, and advantage.","What you sell, its benefits, and pricing.","How you’ll reach and retain customers.","Your workflow, people, and suppliers.","Your costs, sales estimates, and funding.","The key points from your reviewed plan.","Permits and requirements to verify."][index]}
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
          <div className="zee-conversation-header"><img src={beePortrait} alt="Zee" width={56} height={56} /><div><h2>Zee <span className="zee-topic">{section.title}</span></h2><p>{section.draft ? "Keep refining together, then mark your draft reviewed." : "Let’s build your draft together."}</p></div></div>
          <button type="button" className="chat-collapse" aria-expanded={chatOpen} aria-controls="section-chat" onClick={()=>setChatOpen(v=>!v)}>{chatOpen ? "Hide conversation" : "Chat with Zee"}{thinking ? " · Thinking…" : ""}</button>
          <div id="section-chat" hidden={!chatOpen}>
          {!available && (
            <p className="soft-note">
              {isDemo
                ? "Sign in to use Zee, or edit your draft below."
                : "Zee is unavailable. You can still edit below."}
            </p>
          )}
          {chat.length === 0 && introFailed && (
            <Button
              disabled={busy || editing || !available}
              onClick={() =>
                ask(
                  "Start guiding me through this section. Ask me one short question with useful answer choices.",
                )
              }
            >
              <Sparkles size={17} />
              Try Zee again
            </Button>
          )}
          <div className="zee-transcript" ref={transcript} role="log" aria-label={section.title + " conversation"} aria-live="polite">
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
            {thinking && typing}
          </div>
          {available && composer(!!section.draft)}
          </div>
        </section>
        <section className="zee-draft">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="draft-title"><h2>Your draft</h2><button type="button" className="draft-edit-button" aria-label="Edit draft" title="Edit draft" disabled={busy || editing} onClick={() => { editSnapshot.current = { ...section }; setEditing(true); }}><Pencil size={19}/></button></div>
            <Button
              variant="secondary"
              disabled={busy || editing || !revisions.length}
              onClick={() => setHistoryIndex(revisions.length - 1)}
            >
              History ({revisions.length})
            </Button>
          </div>
          {editing ? (
            <div className="draft-inline-editor">
              <label className="sr-only" htmlFor="manual-draft">Edit section draft</label>
              <textarea id="manual-draft" ref={draftInput} value={section.draft} maxLength={30000} disabled={busy} onChange={e => { setSection({ ...section, draft: e.target.value }); setDirty(true); onDirty(true); }} />
              <div className="editor-actions"><span role="status">{dirty ? "Unsaved changes" : "Editing draft"}</span><Button variant="secondary" disabled={busy} onClick={() => { if (editSnapshot.current) setSection(editSnapshot.current); setDirty(false); onDirty(false); setEditing(false); }}>Cancel</Button><Button disabled={busy || !dirty} onClick={async () => { if (await save(false, true)) setEditing(false); }}>Save changes</Button></div>
            </div>
          ) : section.draft ? (
            <>
              <div className="zee-essay" style={{ whiteSpace: 'pre-wrap' }}>
                <DraftChanges before={[...revisions].reverse().find(r => r.draft !== section.draft)?.draft || ""} after={section.draft} />
              </div>

            </>
          ) : (
            <div className="zee-draft-empty">
              <Sparkles size={26} />
              <p>
                Answer Zee to create your draft.
              </p>
            </div>
          )}

          {error && (
            <Modal
              title="We couldn’t complete that"
              onClose={() => setError("")}
            >
              <p>{error}</p>
              <Button onClick={() => setError("")}>Back to my draft</Button>
            </Modal>
          )}
          {!editing && <div className="editor-actions draft-actions">
            {section.draft && available && <Button variant="secondary" onClick={()=>{setChatOpen(true);requestAnimationFrame(()=>document.getElementById("zee-answer")?.focus());}}>Ask Zee to revise</Button>}
            <span>
              {section.status === "reviewed"
                ? "Saved · Reviewed"
                : "Saved · Needs review"}
            </span>

            <Button
              disabled={busy || !section.draft.trim() || section.status === "reviewed"}
              onClick={() => setDecision({ title: "Mark as reviewed?", text: "Have you checked the details and assumptions?", action: () => save(true) })}
            >
              {section.status === "reviewed" ? "Reviewed" : "Mark reviewed"}
              <Check size={16} />
            </Button>
          </div>}
          <div className="section-pagination">
            <button
              disabled={busy || index === 0}
              onClick={() => leave(() => onSection(index - 1), true)}
            >
              <ArrowLeft size={16} />
              Previous
            </button>
            <button
              disabled={busy || dirty || section.status !== "reviewed" || (index === 7 && !plan.sections.every(s=>s.status === "reviewed" && s.draft.trim()))}
              onClick={() => leave(index === 7 ? onReview : () => onSection(index + 1))}
            >
              {index === 7 ? "Review & export" : "Next section"}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
export function Review({
  isDemo,
  plan,
  onBack,
  onEdit,
}: {
  plan: Plan;
  isDemo: boolean;
  onBack: () => void;
  onEdit: (i: number) => void;
}) {
  const [exporting,setExporting]=useState(false);
  const [exportError,setExportError]=useState("");
  const reviewed = plan.sections.filter((s) => s.status === "reviewed").length;
  const canExport = plan.sections.length === 8 && plan.sections.every(s => s.status === "reviewed" && s.draft.trim());
  async function download() {
    if (!canExport) { setExportError("Review all sections before exporting."); return; }
    setExporting(true);
    try {
    const exportPlan = isDemo ? plan : await api<Plan>(`/plans/${plan._id}/export`);
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 25;
    function write(text: string, size: number, justify = false) {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 170);
      for (const [lineIndex,line] of lines.entries()) {
        if (y > 275) {
          doc.addPage();
          y = 22;
        }
        if(justify && lineIndex < lines.length-1 && line.trim().includes(" ")) {
          const words=line.trim().split(/\s+/); const gap=(170-words.reduce((n:number,w:string)=>n+doc.getTextWidth(w),0))/(words.length-1); let x=20;
          words.forEach((w:string)=>{doc.text(w,x,y);x+=doc.getTextWidth(w)+gap;});
        } else doc.text(line, 20, y);
        y += size * 0.5 + 2;
      }
      y += 5;
    }
    doc.setFont("times", "normal");
    write("BUSINESS PLAN", 12);
    write(exportPlan.name, 24);
    write(exportPlan.description, 11);
    write("Prepared with Biz-Z", 10);
    write(new Date().toLocaleDateString(), 10);
    doc.addPage();
    const contentsPage = doc.getNumberOfPages();
    const contents: {title:string;page:number}[] = [];
    const order = [6,0,2,1,3,4,5,7];
    order.forEach((index) => {
      const section=exportPlan.sections[index];
      doc.addPage(); y=25;
      contents.push({title:section.title,page:doc.getNumberOfPages()});
      doc.setFont("times","bold"); write(section.title,16);
      documentBlocks(section.draft).forEach(block=>{if(block.heading && y>250){doc.addPage();y=22;}doc.setFont("times",block.heading?"bold":"normal");write(block.text,block.heading?13:11,!block.heading);});
    });
    doc.setPage(contentsPage); y=25;
    doc.setFont("times","bold");write("Contents",18);
    doc.setFont("times","normal");
    contents.forEach(item=>{doc.setFontSize(11);doc.text(item.title,20,y);doc.text(String(item.page),190,y,{align:"right"});y+=12;});
    const pages=doc.getNumberOfPages();
    for(let page=2;page<=pages;page++) {
      doc.setPage(page);doc.setFontSize(9);doc.setTextColor(100);
      doc.text("Biz-Z | Business plan",20,287);doc.text(String(page),190,287,{align:"right"});
    }
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
            : "Review all 8 sections to unlock export"}
        </span>
        <Button onClick={download} disabled={!canExport || exporting}>
          <Download size={17} />
          Download PDF
        </Button>
      </div>
      {canExport && <NextSteps plan={plan} />}
      <div className="review-document">
        <div className="document-cover">
          <span className="eyebrow">A BUSINESS PLAN BY YOU</span>
          <h1>{plan.name}</h1>
          <p>{plan.description}</p>
          <Bee size={100} happy />
        </div>
        {[6,0,2,1,3,4,5,7].map((i, position) => ({s:plan.sections[i],i,position})).map(({s,i,position}) => (
          <section key={s.title}>
            <div className="flex justify-between gap-3 items-center">
              <h2>
                <span className="yellow-text">0{position + 1}.</span> {s.title}
              </h2>
              <button className="text-button" disabled={!plan.sections.slice(0, i).every(s => s.status === "reviewed")} onClick={() => onEdit(i)}>
                Edit <ChevronRight size={15} />
              </button>
            </div>
            <span className="document-status">
              {s.status.replace("-", " ")}
            </span>
            <FormalDraft text={s.draft || "No draft yet."}/>
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
      {busy && <LoadingScreen label="Getting ready…" branded />}
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
          <span className="password-field">
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
          <button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>} </button>
          </span>
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
