import { useState } from "react";
export function DraftChanges({ before, after }: { before: string; after: string }) {
  const [show, setShow] = useState(true);
  if (!before || before === after) return <p className="whitespace-pre-wrap">{after}</p>;
  const old = before.split(/(\s+)/), next = after.split(/(\s+)/);
  let start = 0, end = 0;
  while (start < old.length && start < next.length && old[start] === next[start]) start++;
  while (end < old.length-start && end < next.length-start && old[old.length-1-end] === next[next.length-1-end]) end++;
  const removed = old.slice(start, old.length-end).join("");
  const added = next.slice(start, next.length-end).join("");
  return <div><button type="button" className="text-button" aria-pressed={show} onClick={() => setShow(!show)}>{show ? "Hide changes" : "Show changes"}</button>{show && <small className="change-legend">Highlighted: added or revised. Crossed out: removed.</small>}<p className="whitespace-pre-wrap">{show ? <>{next.slice(0,start).join("")}{removed && <del className="draft-removed">{removed}</del>}{added && <mark className="draft-added">{added}</mark>}{end ? next.slice(next.length-end).join("") : ""}</> : after}</p></div>;
}
