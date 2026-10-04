export function recordRevision(section, draft, source) {
  if (draft === section.draft) return;
  if (!section.revisions?.length && section.draft) {
    section.revisions.push({ draft: section.draft, source: "Previous draft" });
  }
  section.revisions.push({ draft, source });
}
