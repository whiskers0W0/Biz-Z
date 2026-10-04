import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, type Plan } from "./data";
import { Button, Modal } from "./components";
import { messageSchema, type MessageValues } from "./schemas/forms";
import bee from "./assets/mascot/bee.png";
import "./Adviser.css";
type Conversation = {
  _id: string;
  title: string;
  plan?: string;
  updatedAt: string;
  messages?: { _id: string; role: "user" | "assistant"; text: string }[];
};
export function Adviser({
  plans,
  isDemo,
  onSignIn,
}: {
  plans: Plan[];
  isDemo: boolean;
  onSignIn: () => void;
}) {
  const [chats, setChats] = useState<Conversation[]>([]);
  const [current, setCurrent] = useState<Conversation | null>(null);
  const [context, setContext] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(!isDemo);
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"rename" | "delete" | null>(null);
  const [title, setTitle] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MessageValues>({ resolver: zodResolver(messageSchema) });
  useEffect(() => {
    if (isDemo) return;
    let live = true;
    api<Conversation[]>("/conversations")
      .then((data) => {
        if (live) setChats(data);
      })
      .catch((e) => {
        if (live) setError(e.message);
      }).finally(() => { if (live) setBusy(false); });
    return () => {
      live = false;
    };
  }, [isDemo]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [current, sending]);
  function update(chat: Conversation) {
    setCurrent(chat);
    setChats((old) => [chat, ...old.filter((c) => c._id !== chat._id)]);
  }
  async function open(chat: Conversation) {
    setBusy(true);
    setError("");
    try {
      setCurrent(await api<Conversation>(`/conversations/${chat._id}`));
      reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function send({ message }: MessageValues) {
    setSending(true);
    setPending(message);
    setError("");
    try {
      const chat =
        current ||
        (await api<Conversation>("/conversations", "POST", {
          plan: context || null,
        }));
      update(chat);
      const saved = await api<Conversation>(
        `/conversations/${chat._id}/messages`,
        "POST",
        { message },
      );
      update(saved);
      reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
      setPending("");
    }
  }
  async function change() {
    if (!current) return;
    setBusy(true);
    setError("");
    try {
      if (modal === "delete") {
        await api(`/conversations/${current._id}`, "DELETE");
        setChats((old) => old.filter((c) => c._id !== current._id));
        setCurrent(null);
        reset();
      } else {
        update(
          await api<Conversation>(`/conversations/${current._id}`, "PUT", {
            title: title.trim(),
          }),
        );
      }
      setModal(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (isDemo)
    return (
      <section className="adviser-welcome">
        <img src={bee} alt="Zee" width="90" />
        <h1>Zee Adviser</h1>
        <p>
          Talk through business questions. Save your chats and return anytime.
        </p>
        <Button onClick={onSignIn}>Sign in to chat</Button>
      </section>
    );
  const locked = busy || sending;
  const planName = current?.plan
    ? plans.find((p) => p._id === current.plan)?.name ||
      "Plan no longer available"
    : "General business advice";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Zee Adviser</h1>
          <p>A space for your business questions.</p>
        </div>
      </div>
      <div className="adviser-layout">
        <aside className="adviser-history" aria-label="Saved conversations">
          <Button
            disabled={locked}
            onClick={() => {
              setCurrent(null);
              reset();
              setError("");
            }}
          >
            New chat
          </Button>
          <label htmlFor="chat-search">Search chats</label>
          <input
            id="chat-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a conversation"
          />
          {chats
            .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
            .map((c) => (
              <button
                disabled={locked}
                className={current?._id === c._id ? "selected" : ""}
                aria-pressed={current?._id === c._id}
                key={c._id}
                onClick={() => void open(c)}
              >
                {c.title}
                <small>{new Date(c.updatedAt).toLocaleDateString()}</small>
              </button>
            ))}
          {!chats.length && <p>Your saved chats will appear here.</p>}
        </aside>
        <section className="adviser-chat" aria-label="Chat with Zee">
          <header>
            <div>
              <h2>{current?.title || "What’s on your mind?"}</h2>
              {current ? (
                <small>Context: {planName}</small>
              ) : (
                <>
                  <label htmlFor="chat-context">Plan context (optional)</label>
                  <select
                    id="chat-context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    disabled={locked}
                  >
                    <option value="">General business advice</option>
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>
            {current && (
              <div className="adviser-tools">
                <Button
                  variant="secondary"
                  disabled={locked}
                  onClick={() => {
                    setTitle(current.title);
                    setModal("rename");
                  }}
                >
                  Rename
                </Button>
                <Button
                  variant="secondary"
                  disabled={locked}
                  onClick={() => setModal("delete")}
                >
                  Delete
                </Button>
              </div>
            )}
          </header>
          <div
            className="adviser-messages"
            role="log"
            aria-label="Conversation"
          >
            {!current?.messages?.length && !sending && (
              <div className="adviser-welcome">
                <img src={bee} alt="Zee" width="85" />
                <h3>Let’s think it through.</h3>
                <p>
                  Ask about customers, pricing, marketing or a business
                  challenge.
                </p>
                {[
                  "How can I attract my first customers?",
                  "Help me think through a business challenge.",
                ].map((text) => (
                  <Button
                    variant="secondary"
                    key={text}
                    onClick={() => setValue("message", text)}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            )}
            {current?.messages?.map((m) => (
              <article className={`adviser-message ${m.role}`} key={m._id}>
                <strong>{m.role === "user" ? "You" : "Zee"}</strong>
                <p>{m.text}</p>
              </article>
            ))}
            {pending && (
              <article className="adviser-message user">
                <strong>You</strong>
                <p>{pending}</p>
              </article>
            )}
            {sending && (
              <div
                className="zee-typing"
                role="status"
                aria-label="Zee is thinking"
              >
                Zee{" "}
                <span className="zee-typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
            <div ref={end} />
          </div>
          {error && (
            <p role="alert" className="adviser-error">
              {error}
            </p>
          )}
          {busy && <p role="status">Loading…</p>}
          <form onSubmit={handleSubmit(send)} className="adviser-compose">
            {!!current?.messages?.length && (
              <div className="adviser-tools">
                {["Explain more", "Give me an action plan"].map((text) => (
                  <Button
                    key={text}
                    variant="secondary"
                    disabled={locked}
                    onClick={() => setValue("message", text)}
                  >
                    {text}
                  </Button>
                ))}
              </div>
            )}
            <label htmlFor="adviser-message">Message Zee</label>
            <textarea
              id="adviser-message"
              {...register("message")}
              disabled={locked}
              rows={3}
              maxLength={4000}
              placeholder="What would you like help with?"
            />
            {errors.message && <p role="alert">{errors.message.message}</p>}
            <div className="adviser-send">
              <small>Advice stays in this chat. Your plan is unchanged.</small>
              <Button type="submit" disabled={locked}>
                {sending ? "Thinking…" : "Send"}
              </Button>
            </div>
          </form>
        </section>
      </div>
      {modal && (
        <Modal
          title={modal === "delete" ? "Delete this chat?" : "Rename chat"}
          onClose={() => {
            if (!busy) setModal(null);
          }}
        >
          {modal === "delete" ? (
            <p>This conversation will be permanently removed.</p>
          ) : (
            <label>
              Chat name
              <input
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setModal(null)}
          >
            Cancel
          </Button>
          <Button
            disabled={busy || (modal === "rename" && !title.trim())}
            onClick={() => void change()}
          >
            {modal === "delete" ? "Delete chat" : "Save name"}
          </Button>
        </Modal>
      )}
    </>
  );
}
