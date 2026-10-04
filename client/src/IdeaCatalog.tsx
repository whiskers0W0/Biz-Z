import { useEffect, useState } from "react";
import { api } from "./data";
import { Button, LoadingScreen, Modal } from "./components";
type Match = {
  _id: string;
  name: string;
  description: string;
  score: number;
  reasons: string[];
  tags: string[];
  capital: number;
  currency: string;
  hours: number;
};
export function IdeaCatalog({
  onChoose,
}: {
  onChoose: (name: string, description: string, idea?: string) => void;
}) {
  const [items, setItems] = useState<Match[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [sort, setSort] = useState("score");
  async function load() {
    setLoading(true);
    try {
      setItems(await api<Match[]>("/profiles/me/idea-matches"));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const visible = items
    .filter((i) =>
      (i.name + " " + i.description + " " + i.tags.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "capital"
        ? a.capital - b.capital
        : sort === "hours"
          ? a.hours - b.hours
          : b.score - a.score || a.name.localeCompare(b.name),
    );
  return (
    <section className="tool-card">
      <h2>Explore your matches</h2>
      <p>
        Match scores compare interests (40 points), skills (25), budget (20),
        and time (15). They are planning rules, not a prediction of business
        success. Catalog costs are illustrative PHP assumptions.
      </p>
      {loading && <LoadingScreen label="Matching ideas to your profile…" />}
      {error && (
        <Modal title="Unable to load ideas" onClose={() => setError("")}>
          <p>{error}</p>
          <Button
            onClick={() => {
              setError("");
              void load();
            }}
          >
            Retry
          </Button>
        </Modal>
      )}
      <div className="tool-grid">
        <label>
          Search ideas or interests
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try food, design or pets"
          />
        </label>
        <label>
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="score">Best match</option>
            <option value="capital">Lowest startup capital</option>
            <option value="hours">Fewest weekly hours</option>
          </select>
        </label>
      </div>
      {!loading && !visible.length && (
        <p>
          No ideas match this search. Try another term. If the catalog is empty,
          run the documented sample-data setup.
        </p>
      )}
      <div className="tool-grid">
        {visible.map((i) => (
          <article className="match-card" key={i._id}>
            <span className="pill">{i.score}/100 match</span>
            <h3>{i.name}</h3>
            <p>{i.description}</p>
            <p>
              {i.currency} {i.capital.toLocaleString()} illustrative starting
              capital · {i.hours} hours/week
            </p>
            <ul>
              {i.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <Button onClick={() => onChoose(i.name, i.description, i._id)}>
              Build this idea
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
