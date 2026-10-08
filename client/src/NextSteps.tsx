import { useState } from "react";
import type { Plan } from "./data";
export function NextSteps({plan}:{plan:Plan}) {
 const [topic,setTopic]=useState(plan.description.slice(0,120) || plan.name);
 if(plan.sections.length!==8 || !plan.sections.every(s=>s.status==="reviewed" && s.draft.trim())) return null;
 const query=topic.trim();
 const resources=[
  {title:"Business tutorials",why:"Watch how similar businesses operate.",suffix:"small business how to start",youtube:true},
  {title:"Business model examples",why:"Explore similar offers and revenue models.",suffix:"business model case study"},
  {title:"Practical guides",why:"Find operations and marketing advice.",suffix:"small business operations marketing guide"},
  {title:"Templates & documents",why:"Look for useful planning worksheets.",suffix:"business worksheets templates filetype:pdf"},
 ];
 return <details className="next-resources"><summary>Next steps · Learning resources</summary><p>Search links, not verified recommendations.</p><label htmlFor="resource-topic">Business topic<input id="resource-topic" value={topic} maxLength={160} onChange={e=>setTopic(e.target.value)} /></label><div className="resource-links">{resources.map(r=><article key={r.title}><h3>{r.title}</h3><p>{r.why}</p>{query ? <a href={(r.youtube ? "https://www.youtube.com/results?search_query=" : "https://www.google.com/search?q=")+encodeURIComponent(query+" "+r.suffix)} target="_blank" rel="noopener noreferrer">Search {r.youtube ? "YouTube" : "Google"} ↗</a> : <span>Enter a topic to search.</span>}</article>)}</div></details>;
}
