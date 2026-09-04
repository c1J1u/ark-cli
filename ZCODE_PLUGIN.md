# ark-cli as a ZCode plugin

This repository doubles as an installable **ZCode plugin** (and a Claude Code
plugin, via the compatibility manifest). The plugin exposes the 25 `skills/`
collections — Volcengine Ark capabilities driven by the `arkcli` CLI — to your
AI coding agent: chat, multimodal understanding, image/video generation,
model queries, Plan management, finetuning, endpoint deployment, usage,
billing, and diagnostics.

## Install (ZCode)

1. Settings → Plugin Management → Discover → **+** → add a marketplace from
   the Git URL `https://github.com/c1J1u/ark-cli.git`
2. Install **ark-cli** from the `ark-cli-zcode` marketplace and enable it.
3. Restart / start a new session; `arkcli-*` skills become available.

## Prerequisites

```shell
npm i -g @volcengine/ark-cli@latest
arkcli auth login volc-sso        # browser SSO; use --no-browser on headless hosts
arkcli auth status
```

The `arkcli-shared` skill guides first use (install, login, profile) — you do
not need to pre-configure anything.

## Scope notes

- All 25 upstream skills are shipped unmodified; version tracks upstream
  releases (see manifest `version`).
- Do **not** additionally run `arkcli +connect` targeting `~/.zcode/skills/`:
  user-scope copies shadow plugin skills (first same-named skill wins, user
  scope has priority). The plugin replaces `+connect` for ZCode.
- v1 ships skills only — no hooks, MCP servers, commands, or subagents.

## Maintenance (fork sync)

```shell
git fetch upstream
git merge upstream/main
# bump "version" in .zcode-plugin/plugin.json and .claude-plugin/plugin.json
#   to the new upstream tag (v-stripped), then:
git push origin main
```

Upstreaming: these four files are intentionally additive-only so the whole
change can be offered back to `volcengine/ark-cli` as a PR.

## License

Apache-2.0 © Volcano Engine — skill content belongs to the upstream project;
this packaging layer adds no code.
