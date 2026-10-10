import { MoneyLab } from "./MoneyLab";
import { Adviser } from "./Adviser";
import { PlanSettings } from "./PlanSettings";
import { Workbench } from "./Workbench";
import { useEffect, useEffectEvent, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  useWorkspaceNavigation,
  pagePaths,
} from "./hooks/useWorkspaceNavigation";
import type { Page } from "./hooks/useWorkspaceNavigation";
import {
  Landing,
  StartPage,
  NewPlanPage,
  HelpPage,
  NotFoundPage,
} from "./FlowPages";
import { ApiError } from "./services/api";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Compass,
  Calculator,
  Flower2,
  House,
  LogOut,
  Lock,
  Menu,
  Plus,
  Settings,
  Trash2,
  Zap,
  CircleHelp,
  MessageCircle,
} from "lucide-react";
import { api, emptyProfile, makePlan } from "./data";
import type { Plan, Profile, Section } from "./data";
import { LoadingScreen, Bee, BrandMark, Wordmark, Button, Modal, PageHeading } from "./components";
import { Dashboard } from "./Dashboard";
import { Onboarding, Ideas } from "./Onboarding";
import { Editor, Review, AuthModal } from "./Editor";
import type { User } from "./Editor";
import "./App.css";
const demoKey = "bizz-demo-v1";
function readDemo(): { plans: Plan[]; profile: Profile } {
  try {
    const data = JSON.parse(localStorage.getItem(demoKey) || "null");
    if (data && Array.isArray(data.plans) && data.profile) return data;
  } catch {
    /* Recover from unavailable or invalid storage. */
  }
  return { plans: [], profile: emptyProfile };
}
function App() {
  const [initial] = useState(readDemo);
  const [plans, setPlans] = useState<Plan[]>(initial.plans);
  const [profile, setProfile] = useState<Profile>(initial.profile);
  const [user, setUser] = useState<User | null>(null);
  const [activeId, setActiveId] = useState(initial.plans[0]?._id || "");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const { page, params, navigateTo, blocker } = useWorkspaceNavigation(dirty);
  const [loading, setLoading] = useState(true);
  const [entryTarget, setEntryTarget] = useState<Page | "login" | null>(null);
  const [connectionError, setConnectionError] = useState("");
  const [health, setHealth] = useState({
    database: false,
    ai: false,
    auth: false,
  });
  const active = params.planId
    ? plans.find((p) => p._id === params.planId)
    : plans.find((p) => p._id === activeId) || plans[0];
  const sectionIndex = Number(params.sectionIndex ?? 0);
  const validSection =
    Number.isInteger(sectionIndex) && sectionIndex >= 0 && sectionIndex < 8;
  const sectionLocked =
    sectionIndex > 0 &&
    !active?.sections.slice(0, sectionIndex).every((s) => s.status === "reviewed");
  const completed =
    active?.sections.filter((s) => s.status === "reviewed").length || 0;
  const planComplete = !!active && active.sections.length === 8 && active.sections.every(s => s.status === "reviewed" && s.draft.trim());
  const lockedTool = ["review", "launch"].includes(page) && !!active && !planComplete;
  const isDemo = !user;
  useEffect(() => {
    let cancelled = false;
    async function loadWorkspace() {
      try {
        const status = await api<typeof health>("/health");
        if (cancelled) return;
        setHealth(status);
        if (!status.database || !status.auth) throw new Error("Your account is temporarily unavailable. Please retry shortly.");
        const current = await api<User>("/me");
        const saved = await api<Plan[]>("/plans");
        if (cancelled) return;
        setUser(current);
        setProfile({ ...emptyProfile, ...current.profile });
        setPlans(saved);
        setActiveId(saved[0]?._id || "");
      } catch (error) {
        if (!cancelled && !(error instanceof ApiError && error.status === 401))
          setConnectionError((error as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadWorkspace();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem(demoKey, JSON.stringify({ plans, profile }));
      } catch {
        /* Browser storage may be unavailable. */
      }
    }
  }, [plans, profile, user]);
  function navigate(next: Page) {
    if (["review", "launch"].includes(next) && !planComplete) {
      setToast("Review all 8 sections to unlock this tool."); return;
    }
    if (dirty) {
      setToast("Save your changes before leaving this page.");
      return;
    }
    const path =
      next === "editor" && active
        ? "/plans/" + active._id + "/sections/" + sectionIndex
        : next === "review" && active
          ? "/plans/" + active._id + "/review"
          : next === "dashboard" && active
            ? "/plans/" + active._id
            : pagePaths[next] || "/plans";
    navigateTo(path);
    setMobileMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const finishEntry = useEffectEvent((target: Page | "login") => {
    if (target === "login") setAuthMode("login");
    else navigate(target);
    setEntryTarget(null);
  });
  useEffect(() => {
    if (!entryTarget || loading) return;
    const timer = window.setTimeout(() => finishEntry(entryTarget), window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [entryTarget, loading]);
  async function createPlan(name: string, description: string, idea?: string) {
    setBusy(true);
    try {
      const plan = isDemo
        ? makePlan(name, description)
        : await api<Plan>("/plans", "POST", { name, description, idea });
      setPlans((prev) => [plan, ...prev]);
      setActiveId(plan._id);
      navigateTo("/plans/" + plan._id);
      setToast("Your new business journey is ready!");
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function saveSection(index: number, section: Section) {
    if (!active) return;
    let updated: Plan;
    if (isDemo) {
      const previous = active.sections[index];
      const revisions = [...(previous.revisions || [])];
      const snapshot = (draft: string, source: string) => ({
        _id: crypto.randomUUID(),
        draft,
        source,
        createdAt: new Date().toISOString(),
      });
      if (section.draft !== previous.draft) {
        if (!revisions.length && previous.draft)
          revisions.push(snapshot(previous.draft, "Previous draft"));
        revisions.push(snapshot(section.draft, "Saved edit"));
      }
      section = { ...section, revisions };
      updated = {
        ...active,
        sections: active.sections.map((s, i) =>
          i === index
            ? section
            : i === 6 && index < 6
              ? { ...s, status: s.draft ? "draft" : "not-started" }
              : s,
        ),
        updatedAt: new Date().toISOString(),
      };
    } else
      updated = await api<Plan>(
        `/plans/${active._id}/sections/${index}`,
        "PUT",
        section,
      );
    setPlans((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    return updated;
  }
  function openSection(i: number) {
    if (!active) {
      navigate("onboarding");
      return;
    }
    if (
      i > 0 &&
      !active.sections.slice(0, i).every((s) => s.status === "reviewed")
    ) {
      setToast(
        "Review the earlier sections to unlock this part.",
      );
      return;
    }
    navigateTo("/plans/" + active._id + "/sections/" + i);
  }
  async function removePlan() {
    if (!deleteId) return;
    setBusy(true);
    try {
      if (!isDemo) await api(`/plans/${deleteId}`, "DELETE");
      setPlans((prev) => prev.filter((p) => p._id !== deleteId));
      setDeleteId(null);
      setToast("Plan deleted.");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setConfirmLogout(false);
    setBusy(true);
    try {
      await api("/auth/logout", "POST");
      const demo = readDemo();
      setPlans(demo.plans);
      setProfile(demo.profile);
      setActiveId(demo.plans[0]?._id || "");
      setUser(null);
      setDirty(false);
      navigateTo("/");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const nav = [
    { page: "dashboard" as Page, name: "My journey", icon: House },
    { page: "ideas" as Page, name: "Explore ideas", icon: Compass },
    { page: "plans" as Page, name: "My business plans", icon: BookOpen },
    { page: "adviser" as Page, name: "Zee Adviser", icon: MessageCircle },
    { page: "money" as Page, name: "Money Lab", icon: Calculator },
    { page: "profile" as Page, name: "My profile", icon: Settings },
  ];
  const views: Record<Page, ReactNode> = {
    adviser: <Adviser key={user?.id || "guest"} plans={plans} isDemo={isDemo} onSignIn={() => setAuthMode("login")} />,
    money: <MoneyLab key={user?.id || "guest"} isDemo={isDemo} onDirty={setDirty} />,
    launch: active ? (
      <Workbench
        key={active._id + "launch"}
        planId={active._id}
        onUpdate={(updated) =>
          setPlans((prev) =>
            prev.map((p) => (p._id === updated._id ? updated : p)),
          )
        }
        mode="launch"
        isDemo={isDemo}
      />
    ) : (
      <NotFoundPage onPlans={() => navigate("plans")} />
    ),
    dashboard:
      params.planId && !active ? (
        <NotFoundPage onPlans={() => navigate("plans")} />
      ) : (
        <Dashboard
          active={active}
          profile={profile}
          openSection={openSection}
          onStart={() => navigate("start")}
          onReview={() => navigate("review")}
          onAdviser={() => navigate("adviser")}
        />
      ),
    onboarding: (
      <Onboarding
        profile={profile}
        onExit={() => navigate("dashboard")}
        onComplete={async (p) => {
          if (!isDemo) await api("/profile", "PUT", p);
          setProfile(p);
          navigate("ideas");
          setToast("Profile saved.");
        }}
      />
    ),
    ideas: (
      <Ideas
        profile={profile}
        isDemo={isDemo}
        busy={busy}
        createPlan={createPlan}
        onProfile={() => navigate("onboarding")}
        onOwn={() => navigate("new-plan")}
      />
    ),
    plans: (
      <>
        <PageHeading
          eyebrow="ROOM FOR ALL YOUR BIG IDEAS"
          title="Your business plans"
          text="Pick up where you left off, or start something new."
        />
        <div className="flex justify-end mb-6">
          <Button onClick={() => navigate("start")}>
            <Plus size={18} />
            New business plan
          </Button>
        </div>
        {plans.length === 0 ? (
          <section className="empty-state">
            <Bee size={110} />
            <h2>Create your account.</h2>
            <p>A few things about you. A world of possibilities.</p>
            <Button onClick={() => navigate("start")}>
              Get started <ArrowRight size={17} />
            </Button>
          </section>
        ) : (
          <div className="plans-grid">
            {plans.map((plan) => (
              <article className="plan-card" key={plan._id}>
                <span className={"module-icon growth-stage growth-" + Math.min(4,Math.floor(plan.sections.filter(s=>s.status === "reviewed").length/2))} aria-label={plan.sections.filter(s=>s.status === "reviewed").length === 8 ? "Fully bloomed" : "Growing plan"}>{["🌱","🌿","🪴","🌷","🌻"][Math.min(4,Math.floor(plan.sections.filter(s=>s.status === "reviewed").length/2))]}</span>
                <h2>{plan.name}</h2>
                <p>
                  {plan.description || "Something wonderful is taking shape."}
                </p>
                <div className="plan-progress">
                  <span
                    style={{
                      width: `${(plan.sections.filter((s) => s.status === "reviewed").length / 8) * 100}%`,
                    }}
                  />
                </div>
                <small>
                  {plan.sections.filter((s) => s.status === "reviewed").length}{" "}
                  of 8 sections reviewed
                </small>
                <div className="flex justify-between mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveId(plan._id);
                      navigateTo("/plans/" + plan._id);
                    }}
                  >
                    Open plan <ArrowRight size={16} />
                  </Button>
                  <button
                    className="icon-btn danger"
                    aria-label={`Delete ${plan.name}`}
                    onClick={() => setDeleteId(plan._id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </>
    ),
    editor:
      active && validSection && !sectionLocked ? (
        <Editor
          key={`${active._id}-${sectionIndex}-${active.name}-${active.description}`}
          plan={active}
          index={sectionIndex}
          profile={profile}
          isDemo={isDemo}
          aiAvailable={health.ai}
          onSave={(s) => saveSection(sectionIndex, s)}
          onPlan={(updated) =>
            setPlans((prev) =>
              prev.map((p) => (p._id === updated._id ? updated : p)),
            )
          }
          onBack={() => {
            setDirty(false);
            navigateTo("/plans/" + active._id);
          }}
          onReview={() => navigate("review")}
          onSection={(i) => {
            if (
              i > 0 &&
      !active.sections.slice(0, i).every((s) => s.status === "reviewed")
            ) {
              setToast(
                "Review the earlier sections to unlock this part.",
              );
              return;
            }
            setDirty(false);
            navigateTo("/plans/" + active._id + "/sections/" + i);
          }}
          notify={setToast}
          onDirty={setDirty}
          onMessages={(messages) =>
            setPlans((prev) =>
              prev.map((p) => (p._id === active._id ? { ...p, messages } : p)),
            )
          }
        />
      ) : sectionLocked ? (
        <section className="empty-state mt-8">
          <Bee />
          <h2>This section is locked.</h2>
          <p>Review each earlier section to continue.</p>
          <Button onClick={() => navigate("dashboard")}>
            Back to my journey
          </Button>
        </section>
      ) : (
        <NotFoundPage onPlans={() => navigate("plans")} />
      ),
    review: active ? (
      <Review
        isDemo={isDemo}
        plan={active}
        onBack={() => navigate("dashboard")}
        onEdit={openSection}
      />
    ) : (
      <NotFoundPage onPlans={() => navigate("plans")} />
    ),
    profile: (
      <>
        <PageHeading
          eyebrow="THE PERSON BEHIND THE POSSIBILITY"
          title="A business that feels like you"
          text="Update your profile for better recommendations."
        />
        <section className="profile-card">
          <div className="flex items-center gap-4">
            <span className="avatar large">{user?.name.charAt(0) || "Y"}</span>
            <div>
              <h2>{user?.name || "Your builder profile"}</h2>
              <p>{user?.email || "Exploring in local demo mode"}</p>
            </div>
          </div>
          <h3>Your interests</h3>
          <div className="chips">
            {profile.interests.length ? (
              profile.interests.map((t) => (
                <span className="pill" key={t}>
                  {t}
                </span>
              ))
            ) : (
              <p>Let’s discover what makes you, you.</p>
            )}
          </div>
          <h3>Your personality</h3>
          <div className="chips">
            {profile.traits.map((t) => (
              <span className="pill lavender" key={t}>
                {t}
              </span>
            ))}
          </div>
          <h3>Your working style</h3>
          <div className="chips">{(profile.workStyles || []).map(t => <span className="pill lavender" key={t}>{t}</span>)}</div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("onboarding")}>
              Edit my profile <ArrowRight size={17} />
            </Button>
            {user ? (
              <Button variant="secondary" onClick={() => setConfirmLogout(true)}>
                <LogOut size={17} />
                Sign out
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setAuthMode("register")}
              >
                Create an account
              </Button>
            )}
          </div>
        </section>
      </>
    ),
    landing: (
      <Landing
        onStart={() => setEntryTarget("start")}
        onWorkspace={() => setEntryTarget("dashboard")}
        onLogin={() => setEntryTarget("login")}
      />
    ),
    start: (
      <StartPage
        hasPlans={plans.length > 0}
        onDiscover={() =>
          navigate(profile.interests.length === 5 ? "ideas" : "onboarding")
        }
        onOwn={() => navigate("new-plan")}
        onResume={() => navigate("plans")}
      />
    ),
    "new-plan": (
      <NewPlanPage onCreate={createPlan} onBack={() => navigate("start")} />
    ),
    help: <HelpPage onStart={() => navigate("start")} />,
    "not-found": <NotFoundPage onPlans={() => navigate("plans")} />,
  };
  return (
    <div className={page === "landing" ? "public-shell" : "app-shell"}>
      {(entryTarget || busy) && (
        <LoadingScreen
          branded={!!entryTarget}
          label={entryTarget ? "Getting ready…" : "Saving your changes…"}
        />
      )}
      {page === "landing" ? (
        lockedTool ? <section className="empty-state tool-locked-page"><Lock size={32} /><h2>Complete your business plan first</h2><p>Review all 8 sections to unlock this page.</p><p>{completed} of 8 reviewed</p><Button onClick={()=>openSection(Math.max(0,active!.sections.findIndex(s=>s.status !== "reviewed")))}>Continue my plan</Button></section> : <Outlet context={views} />
      ) : (
        <>
          <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("landing");
              }}
              className="brand"
            >
              <span className="brand-mark">
                <BrandMark size={45} />
              </span>
              <Wordmark />
            </a>
            <div className="sidebar-caption">BIG IDEAS START SMALL</div>
            <nav aria-label="Main navigation">
              {nav.map(({ page: p, name, icon: Icon }) => (
                <button
                  key={p}
                  onClick={() => navigate(p === "ideas" ? "start" : p)}
                  className={`nav-item ${page === p || (p === "ideas" && ["start", "onboarding"].includes(page)) || (p === "plans" && ["editor", "review"].includes(page)) ? "active" : ""}`}
                >
                  <Icon size={21} />
                  {name}
                  {p === "ideas" && <span className="tiny-dot" />}
                </button>
              ))}
            </nav>
            <div className="sidebar-tip">
              <span className="tip-spark">✦</span>
              <p>
                A little progress.
                <br />
                <strong>A lot of possibility.</strong>
              </p>
              <span>
                Your next big thing starts with
                <br />
                one small step.
              </span>
              <div className="tip-flowers">
                <Flower2 size={39} />
                <Flower2 size={27} />
                <Flower2 size={48} />
              </div>
            </div>
            <div className="sidebar-bottom">
              <button className="nav-item" onClick={() => navigate("help")}>
                <CircleHelp size={20} />A little help
              </button>
              <button
                className="user-card"
                onClick={() =>
                  user ? navigate("profile") : setAuthMode("register")
                }
              >
                <span className="avatar">
                  {user?.name.charAt(0).toUpperCase() || "Y"}
                </span>
                <span>
                  <strong>{user?.name || "Your next chapter"}</strong>
                  <small>
                    {user ? "Business builder" : "Create your free account"}
                  </small>
                </span>
                <ChevronRight size={17} />
              </button>
            </div>
          </aside>
          <div className="main-shell">
            <header className="topbar">
              <div className="flex items-center gap-3">
                <button
                  className="icon-btn mobile-toggle"
                  aria-label="Toggle menu"
                  onClick={() => setMobileMenu(!mobileMenu)}
                >
                  <Menu />
                </button>
                <span className="breadcrumb">
                  Your workspace <ChevronRight size={13} />
                  <strong>
                    {page === "dashboard"
                      ? "My journey"
                      : page === "onboarding"
                        ? "Getting to know you"
                        : page === "editor"
                          ? "Plan builder"
                          : page === "review"
                            ? "Plan preview"
                            : nav.find((n) => n.page === page)?.name ||
                              (page === "start"
                                ? "Your starting point"
                                : page === "new-plan"
                                  ? "New business plan"
                                  : page === "help"
                                    ? "A little help"
                                    : page === "money"
                                      ? "Money lab"
                                      : page === "launch"
                                        ? "Launch checklist"
                                        : "Page not found")}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="top-streak">
                  <Zap size={16} fill="currentColor" />
                  {completed} {completed === 1 ? "milestone" : "milestones"}
                </span>
                <span className="header-divider" />
                <button
                  className="round-avatar"
                  aria-label={user ? "Open profile" : "Sign in"}
                  onClick={() =>
                    user ? navigate("profile") : setAuthMode("login")
                  }
                >
                  {user?.name.charAt(0).toUpperCase() || "Y"}
                </button>
              </div>
            </header>
            <main>
              {isDemo && !connectionError && (
                <div className="demo-line">
                  <span>
                    <span className="status-dot" />
                    Demo mode · saved on this device
                  </span>
                  <button onClick={() => setAuthMode("register")}>
                    Save with an account <ArrowRight size={13} />
                  </button>
                </div>
              )}
              {[
                "start",
                "onboarding",
                "ideas",
                "new-plan",
                "editor",
                "review",
              ].includes(page) && (
                <nav
                  className="flow-steps"
                  aria-label="Business planning stages"
                >
                  {[
                    { id: "start" as Page, label: "Your starting point" },
                    { id: "ideas" as Page, label: "Your idea" },
                    { id: "dashboard" as Page, label: "Your plan" },
                    { id: "review" as Page, label: "Review & export" },
                  ].map((step, i) => (
                    <button
                      key={step.id}
                      className={
                        (i === 0 && ["start", "onboarding"].includes(page)) ||
                        (i === 1 && ["ideas", "new-plan"].includes(page)) ||
                        (i === 2 && page === "editor") ||
                        (i === 3 && page === "review")
                          ? "current"
                          : ""
                      }
                      disabled={(i > 1 && !active) || (step.id === "review" && !planComplete)}
                      onClick={() => navigate(step.id)}
                    >
                      <span>{step.id === "review" && !planComplete ? <Lock size={14} /> : i + 1}</span>
                      {step.label}
                    </button>
                  ))}
                </nav>
              )}
              {active &&
                ["dashboard", "editor", "review", "launch"].includes(
                  page,
                ) && (
                  <section className="plan-context" aria-label="Selected business plan">
                    <div className="plan-context-heading">
                      <div className="plan-context-name">
                        <span className="eyebrow">CURRENT PLAN</span>
                        <h2>{active.name}</h2>
                        <span className="plan-context-progress">{active.sections.filter(s => s.status === "reviewed").length} of {active.sections.length} sections reviewed</span>
                      </div>
                      <div className="plan-context-actions">
                        <button className="plan-switch" onClick={() => navigate("plans")}>Switch plan</button>
                        <PlanSettings plan={active} isDemo={isDemo} onUpdate={(updated) => setPlans(prev => prev.map(p => p._id === updated._id ? updated : p))} />
                      </div>
                    </div>
                    <nav className="plan-tools" aria-label="Plan tools">
                      {[
                        ["Overview", ""],
                        ["Build plan", "/sections/" + sectionIndex],
                        ["Review & export", "/review"],

                        ["Launch checklist", "/launch"],
                      ].map(([label, suffix]) => (!planComplete && ["/review", "/launch"].includes(suffix) ? <button type="button" className="plan-tool is-locked" disabled key={label} title="Review all 8 sections to unlock"><Lock size={15} aria-hidden="true" />{label}<span className="sr-only">Locked until all sections are reviewed</span></button> : (
                        <NavLink key={label} end={suffix === ""} to={"/plans/" + active._id + suffix}
                          className={({isActive}) => "plan-tool" + ((isActive || (label === "Build plan" && page === "editor")) ? " is-active" : "")}
                          aria-current={label === "Build plan" && page === "editor" ? "page" : undefined}>
                          {label}
                        </NavLink>
                      )))}
                    </nav>
                    {!planComplete && <p className="tool-lock-note"><Lock size={14} /> {completed}/8 reviewed · Finish all sections to unlock.</p>}
                  </section>
                )}
              {connectionError && !params.planId && (
                <div className="error-message" role="alert">
                  {connectionError}{" "}
                  <button onClick={() => window.location.reload()}>
                    Retry connection
                  </button>
                </div>
              )}
              {loading ? (
                <div className="empty-state mt-8" role="status">
                  <Bee size={80} />
                  <h2>Opening your workspace…</h2>
                </div>
              ) : params.planId && connectionError ? (
                <section className="empty-state connection-recovery" role="alert">
                  <Bee size={100} />
                  <h2>Your plan couldn’t load yet</h2>
                  <p>We couldn’t connect to your account. Retry to load your saved plan.</p>
                  <Button onClick={() => window.location.reload()}>Retry connection</Button>
                </section>
              ) : params.planId && !active && !user ? (
                <section className="empty-state connection-recovery">
                  <Bee size={100} />
                  <h2>Sign in to open your plan</h2>
                  <p>Use the account where you saved it.</p>
                  <Button onClick={() => setAuthMode("login")}>Sign in</Button>
                </section>
              ) : lockedTool ? (
                <section className="empty-state">
                  <Lock size={32} /><h2>Complete your business plan first</h2>
                  <p>Review all 8 sections to unlock this page.</p>
                  <Button onClick={() => openSection(Math.max(0, active!.sections.findIndex(s => s.status !== "reviewed")))}>Continue my plan</Button>
                </section>
              ) : (
                <Outlet context={views} />
              )}
            </main>
          </div>
        </>
      )}
      {blocker.state === "blocked" && (
        <Modal title="Leave this draft?" onClose={() => blocker.reset()}>
          <p>
            You have unsaved changes. Stay and save your work, or leave without
            saving.
          </p>
          <div className="flex gap-3 mt-6">
            <Button onClick={() => blocker.reset()}>Stay here</Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDirty(false);
                blocker.proceed();
              }}
            >
              Leave without saving
            </Button>
          </div>
        </Modal>
      )}
      {toast && (
        <Modal title="An update from Biz-Z" onClose={() => setToast("")}>
          <p>{toast}</p>
          <Button onClick={() => setToast("")}>Got it</Button>
        </Modal>
      )}
      {authMode && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthMode(null)}
          onSuccess={async (u) => {
            const [saved] = await Promise.all([api<Plan[]>("/plans"), new Promise(resolve => setTimeout(resolve, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900))]);
            setConnectionError("");
            setUser(u);
            setProfile({ ...emptyProfile, ...u.profile });
            setPlans(saved);
            setActiveId(saved[0]?._id || "");
            setAuthMode(null);
            setDirty(false);
            navigateTo(params.planId && saved.some(p => p._id === params.planId) ? window.location.pathname : page === "adviser" ? "/adviser" : page === "money" ? "/money" : saved.length ? "/plans/" + saved[0]._id : "/start");
          }}
        />
      )}
      {confirmLogout && (
        <Modal title="Sign out?" onClose={() => setConfirmLogout(false)}>
          <p>{dirty ? "Unsaved changes will be lost. Saved plans stay in your account." : "Your saved plans will be here when you return."}</p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setConfirmLogout(false)}>Stay signed in</Button>
            <Button disabled={busy} onClick={logout}>Sign out</Button>
          </div>
        </Modal>
      )}
      {deleteId && (
        <Modal
          title="Delete this business plan?"
          onClose={() => setDeleteId(null)}
        >
          <p>
            This removes the plan and all of its sections. This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Keep plan
            </Button>
            <Button variant="danger-btn" disabled={busy} onClick={removePlan}>
              {busy ? "Deleting…" : "Delete plan"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default App;
