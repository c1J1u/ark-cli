## Summary

This PR adds two officially maintained Volcengine Ark DSH plugins:

- `volcengine/ark-cli#ark-plan-api` (`model`): registers Ark Agent Plan, Coding Plan and postpaid model routes in the native DSH model picker.
- `volcengine/ark-cli#ark-managed-agents` (`tools`): adds a Managed Agents settings tab and MCP tools to dispatch long-running agent tasks to Ark cloud Managed Agents.

Both plugins ship prebuilt tarballs via the `dsh-plugins/v0.1.0` release in `volcengine/ark-cli`.

## Validation

- [x] Two YAML files added under `data/plugins/` (one per plugin; this PR adds 2 entries, within the 3-entry limit)
- [x] Ran `npm ci && node scripts/generate-readme.mjs` and committed regenerated `README.md` / `README.zh.md`
- [x] Both repos declare `dsh.bundle` in `package.json` with matching `cordis.patch.yml`
- [x] Source repo `volcengine/ark-cli` is >1 day old and has 10+ commits
- [x] Categories are `model` and `tools`, matching plugin functionality
- [x] Descriptions state what each plugin does, no superlatives
- [x] `dsh-plugin` topic is set on `volcengine/ark-cli`
- [x] Tarballs are hosted on GitHub Release: `ark-plan-api.tgz` and `ark-managed-agents.tgz
