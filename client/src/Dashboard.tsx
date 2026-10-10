import beePortrait from "./assets/mascot/bee.png";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Bee, Button } from "./components";
import { subtitles, titles } from "./data";
import type { Plan, Profile } from "./data";
export function Dashboard({
  active,
  profile,
  openSection,
  onStart,
  onReview,
  onAdviser,
}: {
  active?: Plan;
  profile: Profile;
  openSection: (i: number) => void;
  onStart: () => void;
  onReview: () => void;
  onAdviser: () => void;
}) {
  const completed =
    active?.sections.filter((s) => s.status === "reviewed").length || 0;
  const progress = Math.round((completed / 8) * 100);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Your business plan
            <span className="yellow-text">.</span>
          </h1>
          <p>Complete and review each section.</p>
        </div>
        <span className="hello-wave">✺</span>
      </div>
      <div className="dashboard-grid">
        <div className="journey-main">
          <section className="hero-card">
            <div className="hero-copy">
              <span className="pill white-pill">
                <span className="status-dot" />
                YOUR BUSINESS, YOUR WAY
              </span>
              <h2>
                {active ? (
                  <>
                    A little closer to
                    <br />
                    “I built this.”
                  </>
                ) : (
                  <>
                    That idea of yours?
                    <br />
                    Let’s make it real.
                  </>
                )}
              </h2>
              <p>
                {active
                  ? `Keep growing ${active.name}, one thoughtful step at a time.`
                  : "Turn your idea into a plan with Zee."}
              </p>
              <Button
                onClick={() =>
                  active
                    ? completed === 8
                      ? onReview()
                      : openSection(
                          Math.max(
                            0,
                            active.sections.findIndex(
                              (s) => s.status !== "reviewed",
                            ),
                          ),
                        )
                    : onStart()
                }
              >
                {active
                  ? completed === 8
                    ? "See my business plan"
                    : "Continue my journey"
                  : "Get started"}
                <ArrowRight size={18} />
              </Button>
              <span className="hero-footnote">
                {active
                  ? ""
                  : "Made for dreamers. No experience needed."}
              </span>
            </div>
            <div className="hero-art" aria-hidden="true">
              <span className="art-spark s1">✦</span>
              <span className="art-spark s2">✧</span>
              <span className="art-dot" />
              <div className="bee-halo">
                <Bee size={178} happy />
              </div>
              <div className="art-leaf leaf-one" />
              <div className="art-leaf leaf-two" />
              <div className="art-platform" />
              <span className="art-label">let’s grow something!</span>
              <svg className="art-trail" viewBox="0 0 180 80">
                <path
                  d="M2 30C45-20 105 80 150 40S145 5 125 22"
                  fill="none"
                  stroke="#a88529"
                  strokeWidth="2"
                  strokeDasharray="5 6"
                />
              </svg>
            </div>
          </section>
          <section className="journey-section">
            <div className="section-heading">
              <div>
                <h2>
                  Your business journey{" "}
                  <span className="count-chip">8 steps</span>
                </h2>
                <p></p>
              </div>
              <button
                className="text-button"
                disabled={!!active && completed !== 8}
                title={active && completed !== 8 ? "Review all 8 sections to unlock" : undefined}
                onClick={active ? onReview : onStart}
              >
                {active && completed !== 8 && <Lock size={14} />}{active ? "Review & export" : "Let’s begin"}
                <ArrowRight size={15} />
              </button>
            </div>
            <div className="module-grid">
              {titles.map((title, i) => {
                const status = active?.sections[i].status;
                const done = status === "reviewed";
                const locked =
                  i > 0 &&
                  !active?.sections
                    .slice(0, i)
                    .every((s) => s.status === "reviewed");
                return (
                  <button
                    key={title}
                    className={`module-card module-${i} ${done ? "completed" : ""}`}
                    disabled={locked}
                    onClick={() => openSection(i)}
                  >
                    <div className="module-top">
                      <span className={`module-icon color-${i % 4}`}>
                        {["🌱", "🔎", "💎", "📣", "⚙️", "💰", "✨", "🛡️"][i]}
                      </span>
                      <span className="step-number">
                        {done ? <CheckCircle2 size={19} /> : `0${i + 1}`}
                      </span>
                    </div>
                    <h3>{title}</h3>
                    <p>{subtitles[i]}</p>
                    <div className="module-footer">
                      <span
                        className={
                          done
                            ? "green-text"
                            : status === "draft"
                              ? "draft-text"
                              : ""
                        }
                      >
                        {done
                          ? "Reviewed"
                          : locked
                            ? `Review step ${i} to unlock`
                            : status === "draft"
                              ? "Keep building"
                              : "Ready when you are"}
                      </span>
                      {locked ? <Lock size={13} /> : <ArrowRight size={16} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        <aside className="right-rail">
          <section className="progress-card">
            <div className="flex justify-between items-center">
              <h3>Your growing progress</h3>
              <span className="small-icon">
                <Target size={17} />
              </span>
            </div>
            <div
              className="progress-ring"
              style={{
                background: `conic-gradient(#65a944 ${progress}%, #eef1e8 0)`,
              }}
            >
              <div>
                <span aria-label={completed === 8 ? "Fully bloomed" : "Growing plan"}>{["🌱","🌿","🪴","🌷","🌻"][Math.min(4,Math.floor(completed/2))]}</span>
                <strong>{progress}%</strong>
                <small>of your plan</small>
              </div>
            </div>
            <h4>
              {completed === 8
                ? "Look what you built!"
                : completed > 0
                  ? "Look at you growing!"
                  : "Every expert was a beginner"}
            </h4>
            <p>
              {completed} of 8 sections reviewed.
              <br />
              {completed === 8
                ? "Your next move starts here."
                : ""}
            </p>
            <div className="mini-progress">
              {titles.map((t, i) => (
                <span
                  key={t}
                  className={
                    active?.sections[i].status === "reviewed" ? "filled" : ""
                  }
                />
              ))}
            </div>
          </section>
          <section className="zee-card">
            <div className="zee-top">
              <span className="zee-avatar">
                <img src={beePortrait} alt="Zee" width={50} height={50} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
              </span>
              <div>
                <h3>Zee Adviser</h3>
                <span>Your business thinking partner</span>
              </div>
              <Sparkles size={17} />
            </div>
            <p>
              Talk through a challenge or get a second opinion.
            </p>
            <button onClick={onAdviser}>
              Talk to Zee <MessageCircle size={16} />
            </button>
          </section>
          <section className="small-win">
            <span className="win-icon">
              <Trophy size={22} />
            </span>
            <div>
              <span className="eyebrow">YOUR FIRST LITTLE WIN</span>
              <h4>
                {profile.interests.length === 5
                  ? "A little more you"
                  : "Start with you"}
              </h4>
              <p>
                {profile.interests.length === 5
                  ? "Your interests are the seeds of something great."
                  : "Discover what makes your business journey unique."}
              </p>
              <button className="text-button" onClick={onStart}>
                {profile.interests.length === 5
                  ? "Revisit your profile"
                  : "Build my profile"}
                <ArrowRight size={14} />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
