import { useEffect } from "react";
import { useBlocker, useMatches, useNavigate } from "react-router-dom";
export type Page =
  | "landing"
  | "start"
  | "dashboard"
  | "onboarding"
  | "ideas"
  | "plans"
  | "new-plan"
  | "editor"
  | "money"
  | "launch"
  | "review"
  | "profile"
  | "adviser"
  | "help"
  | "not-found";
export const pagePaths: Partial<Record<Page, string>> = {
  landing: "/",
  start: "/start",
  dashboard: "/workspace",
  onboarding: "/onboarding",
  ideas: "/ideas",
  plans: "/plans",
  "new-plan": "/plans/new",
  profile: "/profile",
  help: "/help",
  adviser: "/adviser",
  "not-found": "/not-found",
};
export function useWorkspaceNavigation(dirty: boolean) {
  const matches = useMatches();
  const matched = matches[matches.length - 1];
  const page = (matched?.handle as { page: Page })?.page || "not-found";
  const navigateTo = useNavigate();
  const blocker = useBlocker(dirty);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = `Biz-Z · ${page === "landing" ? "Your next big thing" : page.replaceAll("-", " ")}`;
  }, [page, matched?.pathname]);
  return { page, params: matched?.params || {}, navigateTo, blocker };
}
