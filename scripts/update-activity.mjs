// Rewrites the block between <!-- ACTIVITY:START --> and <!-- ACTIVITY:END -->
// in README.md with recent public GitHub activity. Run by .github/workflows/activity.yml.
import { readFileSync, writeFileSync } from "node:fs";

const USER = "Nightmare33n";
const MAX = 5;
const README = new URL("../README.md", import.meta.url);

const headers = { "User-Agent": USER, Accept: "application/vnd.github+json" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

const res = await fetch(`https://api.github.com/users/${USER}/events/public?per_page=100`, { headers });
if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
const events = await res.json();

const link = (repo) => `[${repo.replace(`${USER}/`, "")}](https://github.com/${repo})`;
const date = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function describe(e) {
  const repo = e.repo.name;
  if (repo === `${USER}/${USER}`) return null; // skip this profile repo's own bot commits
  const p = e.payload;
  switch (e.type) {
    case "PushEvent": {
      const n = p.size ?? p.commits?.length ?? 0;
      return n ? `⬆️ Pushed ${n} commit${n > 1 ? "s" : ""} to ${link(repo)}` : null;
    }
    case "CreateEvent":
      return p.ref_type === "repository" ? `✨ Created ${link(repo)}` : null;
    case "ReleaseEvent":
      return p.action === "published" ? `🚀 Released [${p.release.tag_name}](${p.release.html_url}) of ${link(repo)}` : null;
    case "PullRequestEvent":
      if (p.action === "opened") return `🔀 Opened PR [#${p.number}](${p.pull_request.html_url}) in ${link(repo)}`;
      if (p.action === "closed" && p.pull_request.merged) return `🟣 Merged PR [#${p.number}](${p.pull_request.html_url}) in ${link(repo)}`;
      return null;
    case "IssuesEvent":
      return p.action === "opened" ? `🐛 Opened issue [#${p.issue.number}](${p.issue.html_url}) in ${link(repo)}` : null;
    default:
      return null;
  }
}

// One line per repo+action, newest first, so a burst of pushes doesn't flood the list.
const seen = new Set();
const lines = [];
for (const e of events) {
  const text = describe(e);
  if (!text) continue;
  const key = `${e.type}:${e.repo.name}`;
  if (seen.has(key)) continue;
  seen.add(key);
  lines.push(`<sub>${date(e.created_at)}</sub> &nbsp; ${text}`);
  if (lines.length === MAX) break;
}

const body = lines.length ? lines.map((l, i) => `${i + 1}. ${l}`).join("\n") : "_Nothing public lately — probably shipping something private._";
const readme = readFileSync(README, "utf8");
const next = readme.replace(
  /(<!-- ACTIVITY:START -->)[\s\S]*?(<!-- ACTIVITY:END -->)/,
  `$1\n${body}\n$2`
);

if (next === readme) console.log("activity unchanged");
else {
  writeFileSync(README, next);
  console.log(`activity updated (${lines.length} items)`);
}
