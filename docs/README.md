# Documentation Map

This repository contains both canonical documentation and historical/team notes. Use this page to avoid conflicting setup instructions.

## Canonical Documents

| Document | Use for |
|---|---|
| [../README.md](../README.md) | Project overview, stack, team, module scope |
| [../README_install_and_start.md](../README_install_and_start.md) | Setup, local development, Docker demo/evaluation, shutdown, troubleshooting |
| [architecture.md](architecture.md) | Current architecture and folder reference |
| [major_modules/README.md](major_modules/README.md) | One README per major 42 module (intro, stack, how it works, diagram) — evaluation/defense reference |

If another document contradicts one of these, prefer the canonical document.

## Active Files In `docs/`

These files stay in the main `docs/` folder because they are still directly useful:

| Path | Notes |
|---|---|
| [42 EvalHub.pdf](42%20EvalHub.pdf) | Evaluation reference |
| [ft_transcendence.subject.pdf](ft_transcendence.subject.pdf) | Official 42 subject |
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Internal roadmap kept as-is |

## Archive

The `archive/` folder keeps older but still interesting material:

| Path | Notes |
|---|---|
| `archive/modules.md` | Older module planning/reference |
| `archive/team-organization.md` | Team process notes |
| `archive/ownership.md` | Main historical ownership document |
| `archive/Role_par_fichier.md`, `archive/ownership-migration.md`, `archive/organisation_role_push.md`, `archive/Martin_role.md` | Older role and ownership notes |
| `archive/project-cleanup-audit.md` | Earlier cleanup audit snapshot |
| `archive/dev-mode-check.md` | Old local startup check |
| `archive/git-commands-guide.md` | Git help kept for team memory |
| `archive/proposition_mvp_kickoff/` | Earlier MVP proposal and screenshots |

## To Delete

The `to_delete/` folder is for documents we do not want to use anymore, but we still keep them in the repository to avoid losing information.

| Path | Notes |
|---|---|
| `to_delete/Tickets-Jerem-Elise.md` | Older planning note |
| `to_delete/Tickets2.md` | Older planning note |
| `to_delete/ticket.txt` | Older planning note |
| `to_delete/ticket1.md` | Older planning note |
| `to_delete/git-organization.md` | Redundant git organization note |

## Other Historical Folders

These folders are outside `docs/`, but they are still kept for team memory.

| Folder | Purpose |
|---|---|
| `../backend_doc/` | Backend implementation notes |
| `../frontend_doc/` | Frontend implementation notes |
| `../background_doc/` | Background technical notes |
| `../history_debug/` | Debugging history |
| `../PedagoGamePlay/` | Pedagogical gameplay notes |
| `../probleme_rencontre/` | Historical problem/correction notes |

## Review Rule

When updating startup, workflow, or architecture information:

1. Update the canonical document first.
2. Link historical notes only when they still add context.
3. Do not duplicate startup commands in multiple places.
