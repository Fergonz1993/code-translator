// ===== OSS RADAR SCAN =====
// Generates a lightweight “OSS radar” report using the GitHub Search API.
//
// Goal:
// - Help contributors quickly discover maintained open-source projects/patterns
//   before re-inventing common infrastructure.
// - Output is metadata only (links + license + stars), not copied code.
//
// Usage:
// - bun run oss:scan
// - bun run oss:scan -- --config oss-scan.config.json --out docs/OSS_RADAR.md
//
// Notes:
// - For higher rate limits, set GITHUB_TOKEN (or GH_TOKEN) when running locally.

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type OssScanQuery = {
  name: string;
  q: string;
  sort?: "stars" | "updated";
  perPage?: number;
};

type OssScanConfig = {
  perPage?: number;
  out?: string;
  queries: OssScanQuery[];
};

type GitHubRepoSearchItem = {
  full_name: string;
  html_url: string;
  stargazers_count: number;
  updated_at: string;
  description: string | null;
  license: { spdx_id: string | null } | null;
};

type GitHubRepoSearchResponse = {
  items: GitHubRepoSearchItem[];
};

const DEFAULT_CONFIG_PATH = "oss-scan.config.json";
const DEFAULT_OUT_PATH = "docs/OSS_RADAR.md";
const DEFAULT_PER_PAGE = 10;

function escapeMarkdownCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ").replaceAll("\r", " ");
}

function formatDate(iso: string): string {
  // ISO like: 2026-01-11T12:34:56Z
  return iso.slice(0, 10);
}

function parseArgs(argv: string[]): { configPath: string; outPath: string } {
  let configPath = DEFAULT_CONFIG_PATH;
  let outPath = DEFAULT_OUT_PATH;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--config") {
      const next = argv[i + 1];
      if (!next) throw new Error("Missing value for --config");
      configPath = next;
      i++;
      continue;
    }

    if (arg === "--out") {
      const next = argv[i + 1];
      if (!next) throw new Error("Missing value for --out");
      outPath = next;
      i++;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      // eslint-disable-next-line no-console
      console.log(
        "Usage: bun run oss:scan -- [--config oss-scan.config.json] [--out docs/OSS_RADAR.md]"
      );
      process.exit(0);
    }
  }

  return { configPath, outPath };
}

async function readConfig(configPath: string): Promise<OssScanConfig> {
  const raw = await fs.readFile(configPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid config: expected a JSON object");
  }

  const config = parsed as Partial<OssScanConfig>;

  if (!Array.isArray(config.queries) || config.queries.length === 0) {
    throw new Error("Invalid config: expected a non-empty queries array");
  }

  for (const query of config.queries) {
    if (!query || typeof query !== "object") {
      throw new Error("Invalid config: each query must be an object");
    }

    if (!query.name || typeof query.name !== "string") {
      throw new Error("Invalid config: each query needs a string 'name'");
    }

    if (!query.q || typeof query.q !== "string") {
      throw new Error("Invalid config: each query needs a string 'q'");
    }

    if (query.sort && query.sort !== "stars" && query.sort !== "updated") {
      throw new Error("Invalid config: query.sort must be 'stars' or 'updated'");
    }

    if (
      query.perPage !== undefined &&
      (typeof query.perPage !== "number" || query.perPage < 1 || query.perPage > 100)
    ) {
      throw new Error("Invalid config: query.perPage must be a number 1..100");
    }
  }

  if (
    config.perPage !== undefined &&
    (typeof config.perPage !== "number" || config.perPage < 1 || config.perPage > 100)
  ) {
    throw new Error("Invalid config: perPage must be a number 1..100");
  }

  if (config.out !== undefined && typeof config.out !== "string") {
    throw new Error("Invalid config: out must be a string");
  }

  return config as OssScanConfig;
}

async function githubSearchRepos(
  query: string,
  sort: "stars" | "updated",
  perPage: number,
  token: string
): Promise<GitHubRepoSearchResponse> {
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", sort);
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", String(perPage));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "code-translator-oss-radar",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const isRateLimited = response.status === 403 && body.toLowerCase().includes("rate limit");

    if (isRateLimited) {
      throw new Error(
        "GitHub API rate limit exceeded. Re-run with GITHUB_TOKEN set (or wait and try again)."
      );
    }

    const shortBody = body.length > 300 ? `${body.slice(0, 300)}…` : body;
    throw new Error(`GitHub API error ${response.status}: ${shortBody}`);
  }

  return (await response.json()) as GitHubRepoSearchResponse;
}

function renderMarkdown(configPath: string, sections: Array<{ name: string; q: string; items: GitHubRepoSearchItem[] }>): string {
  let md = "";
  md += "# OSS Radar\n\n";
  md += "> This file is auto-generated. Do not hand-edit.\n\n";
  md += `How to update locally: \`bun run oss:scan\` (config: \`${configPath}\`)\n\n`;

  for (const section of sections) {
    md += `## ${escapeMarkdownCell(section.name)}\n\n`;
    md += `Query: \`${section.q}\`\n\n`;
    md += "| Repo | Stars | Updated | License | Description |\n";
    md += "|---|---:|---|---|---|\n";

    if (section.items.length === 0) {
      md += "| _No matches_ |  |  |  | Tune `oss-scan.config.json` queries |\n";
    } else {
      for (const item of section.items) {
        const repo = escapeMarkdownCell(item.full_name);
        const url = item.html_url;
        const stars = item.stargazers_count;
        const updated = escapeMarkdownCell(formatDate(item.updated_at));
        const license = escapeMarkdownCell(item.license?.spdx_id ?? "UNKNOWN");
        const description = escapeMarkdownCell(item.description ?? "");

        md += `| [${repo}](${url}) | ${stars} | ${updated} | ${license} | ${description} |\n`;
      }
    }

    md += "\n";
  }

  return md;
}

async function main(): Promise<void> {
  const { configPath: rawConfigPath, outPath: rawOutPath } = parseArgs(process.argv);

  const configPath = path.resolve(rawConfigPath);
  const config = await readConfig(configPath);

  const outPath = path.resolve(rawOutPath || config.out || DEFAULT_OUT_PATH);
  const perPageDefault = config.perPage ?? DEFAULT_PER_PAGE;

  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";

  const sections: Array<{ name: string; q: string; items: GitHubRepoSearchItem[] }> = [];

  for (const query of config.queries) {
    const perPage = query.perPage ?? perPageDefault;
    const sort = query.sort ?? "stars";
    const result = await githubSearchRepos(query.q, sort, perPage, token);
    sections.push({ name: query.name, q: query.q, items: result.items ?? [] });
  }

  const markdown = renderMarkdown(path.basename(configPath), sections);

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, markdown, "utf8");

  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "OSS scan failed";
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
});
