// ── Task Link Storage (localStorage) ──────────────────────────────────────────
// Task links are stored client-side because the backend updateTask API
// doesn't have a link field. Links persist across sessions via localStorage.

const TASK_LINKS_KEY = "darkcoin_task_links";

export function getTaskLinks(): Record<number, string> {
  try {
    return JSON.parse(localStorage.getItem(TASK_LINKS_KEY) || "{}") as Record<
      number,
      string
    >;
  } catch {
    return {};
  }
}

export function setTaskLink(taskId: number, link: string): void {
  const links = getTaskLinks();
  if (link.trim()) {
    links[taskId] = link.trim();
  } else {
    delete links[taskId];
  }
  localStorage.setItem(TASK_LINKS_KEY, JSON.stringify(links));
}

export function getTaskLink(taskId: number): string | undefined {
  return getTaskLinks()[taskId];
}
