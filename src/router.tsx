import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import type { Page } from "./hooks/useWorkspaceNavigation";
import { WorkspacePage } from "./WorkspacePage";
const routes: { path: string; page: Page }[] = [
  { path: "/", page: "landing" },
  { path: "/start", page: "start" },
  { path: "/workspace", page: "dashboard" },
  { path: "/onboarding", page: "onboarding" },
  { path: "/ideas", page: "ideas" },
  { path: "/plans", page: "plans" },
  { path: "/plans/new", page: "new-plan" },
  { path: "/plans/:planId", page: "dashboard" },
  { path: "/plans/:planId/sections/:sectionIndex", page: "editor" },
  { path: "/plans/:planId/review", page: "review" },
  { path: "/profile", page: "profile" },
  { path: "/help", page: "help" },
  { path: "*", page: "not-found" },
];
export const router = createBrowserRouter([
  {
    element: <App />,
    children: routes.map(({ path, page }) => ({
      path,
      element: <WorkspacePage name={page} />,
      handle: { page },
    })),
  },
]);
