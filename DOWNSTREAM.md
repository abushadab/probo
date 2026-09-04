# Downstream development

This repository is a downstream fork of
[`getprobo/probo`](https://github.com/getprobo/probo).

## Branch and remote policy

- `upstream` points to `getprobo/probo`.
- `origin` points to `abushadab/probo`.
- `main` is the protected product trunk and must remain deployable.
- Product work uses short-lived `feature/*` branches and pull requests.
- Shared product branches are updated with merge commits, not rebased.

The scheduled `Downstream upstream sync` workflow checks upstream every day.
When updates exist, it refreshes `automation/upstream-sync`, dispatches the
downstream CI workflow for that commit, and opens a pull request into `main`.
Conflicts are reported as a GitHub issue for manual resolution.

Normal upstream updates should be reviewed and promoted in batches. Security
fixes can be prioritized immediately. Production releases should record both
the downstream release identifier and the incorporated upstream commit.

## Keeping the fork thin

- Prefer additive packages, migrations, routes, and feature flags.
- Avoid broad edits to generated files, authentication, and shared primitives.
- Submit generic fixes and useful extension points upstream when practical.
- Keep downstream behavior covered by end-to-end and contract tests.
- Update the capability matrix before starting a significant feature.

## Third-party feature research

Feature specifications must describe user outcomes and acceptance criteria in
our own words.

- Probo is MIT licensed and is the base of this fork.
- OpenLane is Apache-2.0 licensed. Any direct reuse requires a license and
  attribution review before code is imported.
- Comp AI is AGPL-3.0 licensed. Treat it as product research only unless the
  project deliberately accepts the corresponding source-disclosure terms.
- Vanta is proprietary. Use only public product behavior and independently
  written requirements; do not copy code, text, assets, or distinctive UI.

This document is an engineering policy, not legal advice. Escalate uncertain
reuse decisions for legal review.
