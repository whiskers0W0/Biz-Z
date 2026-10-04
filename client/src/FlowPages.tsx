import {
  ArrowRight,
  ArrowLeft,
  Check,
  Compass,
  Lightbulb,
  BookOpen,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoadingScreen, Bee, BrandMark, Wordmark, Button, PageHeading } from "./components";
import { planSchema } from "./schemas/planSchema";
import type { PlanFormValues } from "./schemas/planSchema";

export function Landing({
  onStart,
  onWorkspace,
  onLogin,
}: {
  onStart: () => void;
  onWorkspace: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <a className="brand" href="/" aria-label="Biz-Z home">
          <BrandMark size={44} />
          <Wordmark />
        </a>
        <nav aria-label="Website navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#what-you-build">What you’ll build</a>
          <button onClick={onLogin}>Sign in</button>
          <Button onClick={onStart}>
            Let’s get started <ArrowRight size={16} />
          </Button>
        </nav>
      </header>
      <main className="landing-main">
        <section className="landing-hero">
          <div>
            <span className="pill">
              BIG IDEAS START SMALL
            </span>
            <h1>
              Big business dreams.
              <br />
              <span>Small, doable steps.</span>
            </h1>
            <p>
              Find your idea. Build your plan with Zee.
            </p>
            <div className="landing-actions">
              <Button onClick={onStart}>
                Start my plan <ArrowRight size={18} />
              </Button>
              <button className="text-button" onClick={onWorkspace}>
                Explore workspace <ArrowRight size={15} />
              </button>
            </div>
            <div className="landing-promises">
              <span>
                <Check size={15} />
                No experience needed
              </span>
              <span>
                <Check size={15} />
                Go at your own pace
              </span>
            </div>
          </div>
          <div className="landing-illustration">
            <span className="landing-spark one">✦</span>
            <span className="landing-spark two">✧</span>
            <div className="landing-bee">
              <Bee size={230} happy />
            </div>
            <div className="floating-card card-idea">
              <Lightbulb size={21} />
              <span>
                A little spark<strong>Your next big idea</strong>
              </span>
            </div>
            <div className="floating-card card-plan">
              <Check size={22} />
              <span>
                One step at a time<strong>Your plan, taking shape</strong>
              </span>
            </div>
            <div className="landing-sticker">
              Build it with Zee.
            </div>
          </div>
        </section>
        <section id="how-it-works" className="landing-section">
          <div className="eyebrow">FROM “WHAT IF” TO “WHAT’S NEXT”</div>
          <h2>Three steps to your plan.</h2>
          <p>Start with an idea. Zee will guide you.</p>
          <div className="landing-steps">
            {[
              {
                id: "discover",
                number: "01",
                title: "Find your direction",
                text: "Pick five interests and traits, or bring your own idea.",
                icon: <Compass />,
              },
              {
                id: "build",
                number: "02",
                title: "Build it piece by piece",
                text: "Answer Zee’s questions, one section at a time.",
                icon: <BookOpen />,
              },
              {
                id: "review",
                number: "03",
                title: "See the whole picture",
                text: "Review, refine, and download your plan.",
                icon: <ShieldCheck />,
              },
            ].map((step) => (
              <article key={step.id}>
                <span className="landing-step-number">{step.number}</span>
                <span className="module-icon color-0">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="what-you-build" className="landing-feature">
          <div>
            <span className="eyebrow">
              THOUGHTFUL PLANS. LESS BLANK-PAGE PANIC.
            </span>
            <h2>
              A business plan that’s yours,
              <br />
              from the first word.
            </h2>
            <p>
              Zee turns your answers into eight tailored sections. Review and refine each draft.
            </p>
            <div className="landing-feature-tags">
              <span>🌱 Your business</span>
              <span>🔎 Your customers</span>
              <span>💰 Your numbers</span>
              <span>✨ Your next move</span>
            </div>
            <Button onClick={onStart}>
              Get started <ArrowRight size={17} />
            </Button>
          </div>
          <div className="landing-section-list">
            {[
              "Company overview",
              "Market & competition",
              "Products & services",
              "Marketing & sales",
              "Operations & management",
              "Financial plan & funding",
              "Executive summary",
              "Legal compliance",
            ].map((title, i) => (
              <div key={title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{title}</strong>
                <Check size={15} />
              </div>
            ))}
          </div>
        </section>
        <section className="landing-bottom">
          <Sparkles size={26} />
          <h2>Your idea deserves a first step.</h2>
          <p>You bring the possibility. Let’s work on the plan.</p>
          <Button onClick={onStart}>
            Let’s build something <ArrowRight size={18} />
          </Button>
          <small>
            Try the local demo now. Accounts and AI need a configured server
            connection.
          </small>
        </section>
      </main>
      <footer className="landing-footer">
        <strong>biz-z.</strong>
        <span>Small steps. Your big business.</span>
        <a href="#how-it-works">Back to the beginning ↑</a>
      </footer>
    </div>
  );
}
export function StartPage({
  hasPlans,
  onDiscover,
  onOwn,
  onResume,
}: {
  hasPlans: boolean;
  onDiscover: () => void;
  onOwn: () => void;
  onResume: () => void;
}) {
  return (
    <>
      <PageHeading
        eyebrow="START WHERE YOU ARE"
        title="What brings you here?"
        text="Choose how to start."
      />
      <div className="start-options">
        <button onClick={onDiscover}>
          <span className="module-icon color-2">
            <Compass />
          </span>
          <h2>I’m looking for an idea</h2>
          <p>
            Share your interests and budget to find ideas.
          </p>
          <strong>
            Discover my direction <ArrowRight size={17} />
          </strong>
        </button>
        <button onClick={onOwn}>
          <span className="module-icon color-0">
            <Lightbulb />
          </span>
          <h2>I already have an idea</h2>
          <p>
            Name your idea and start planning.
          </p>
          <strong>
            Build my idea <ArrowRight size={17} />
          </strong>
        </button>
      </div>
      {hasPlans && (
        <div className="returning-builder">
          <Bee size={65} />
          <div>
            <h3>Already growing something?</h3>
            <p>Your saved plans are ready when you are.</p>
          </div>
          <Button variant="secondary" onClick={onResume}>
            Open my plans <ArrowRight size={16} />
          </Button>
        </div>
      )}
    </>
  );
}
export function NewPlanPage({
  onCreate,
  onBack,
}: {
  onCreate: (name: string, description: string) => Promise<boolean>;
  onBack: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", description: "" },
    mode: "onTouched",
  });
  return (
    <>
      {isSubmitting && <LoadingScreen label="Creating your plan…" />}
      <button className="text-button mt-6" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to my starting point
      </button>
      <PageHeading
        eyebrow="LET’S GIVE THAT IDEA A HOME"
        title="Start your business plan"
        text="Start with a name and a short description."
      />
      <form
        className="new-plan-form"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          if (!(await onCreate(values.name, values.description)))
            setError("root", {
              message:
                "Couldn’t save your plan. Your answers are kept. Try again.",
            });
        })}
      >
        <label>
          Business name
          <input
            {...register("name")}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="e.g. Little Batch Bakery"
          />
          {errors.name && (
            <span id="name-error" className="field-error" role="alert">
              {errors.name.message}
            </span>
          )}
        </label>
        <label>
          What would you like to build?
          <textarea
            {...register("description")}
            aria-invalid={!!errors.description}
            placeholder="What will you offer, and who would you love to help?"
          />
          {errors.description && (
            <span className="field-error" role="alert">
              {errors.description.message}
            </span>
          )}
        </label>
        <div className="soft-note">
          <Lightbulb size={20} />
          Next: build your company overview with Zee.
        </div>
        {errors.root && (
          <p className="error-message" role="alert">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating your plan…" : "Create my plan"}
          <ArrowRight size={17} />
        </Button>
      </form>
    </>
  );
}
export function HelpPage({ onStart }: { onStart: () => void }) {
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE CLARITY GOES A LONG WAY"
        title="Your guide to getting started"
        text="Everything you need to know about building with Biz-Z."
      />
      <div className="help-sections">
        {[
          {
            id: "start",
            title: "1. Choose a starting point",
            body: "Complete your profile for ideas, or start with your own.",
          },
          {
            id: "draft",
            title: "2. Build, save, and review",
            body: "Answer Zee’s questions. Review the generated draft, request changes, then mark it reviewed.",
          },
          {
            id: "ai",
            title: "3. Refine with Zee",
            body: "Zee starts each section automatically. Ask for changes below the draft, or edit it yourself.",
          },
          {
            id: "summary",
            title: "4. Bring the story together",
            body: "Review sections 1 to 6 to unlock your summary. Earlier edits require another summary review.",
          },
          {
            id: "export",
            title: "5. Preview and export",
            body: "Preview and download your PDF anytime. Unfinished sections are labeled.",
          },
          {
            id: "storage",
            title: "Where is my work saved?",
            body: "Demo plans stay in this browser. Account plans save online. Demo plans do not transfer when you sign in.",
          },
        ].map((item) => (
          <section key={item.id}>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </section>
        ))}
        <Button onClick={onStart}>
          Get started <ArrowRight size={17} />
        </Button>
      </div>
    </>
  );
}
export function NotFoundPage({ onPlans }: { onPlans: () => void }) {
  return (
    <section className="empty-state mt-8">
      <Bee size={100} />
      <span className="eyebrow">THIS PATH DOESN’T LEAD TO A PLAN</span>
      <h1>We couldn’t find that page.</h1>
      <p>
        The link may be incorrect, or the plan may not belong to this workspace.
      </p>
      <Button onClick={onPlans}>
        Go to my plans <ArrowRight size={17} />
      </Button>
    </section>
  );
}
