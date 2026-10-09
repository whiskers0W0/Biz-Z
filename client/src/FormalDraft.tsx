import { documentBlocks } from "./documentBlocks";
export function FormalDraft({ text }: { text: string }) {
  return (
    <div className="formal-document">
      {documentBlocks(text).map((b, i) =>
        b.heading ? <h3 key={i}>{b.text}</h3> : <p key={i}>{b.text}</p>,
      )}
    </div>
  );
}
