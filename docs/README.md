# Documentation Map

This repository contains both canonical documentation and historical/team notes. Use this page to avoid conflicting setup instructions.

## Canonical Documents

| Document | Use for |
|---|---|
| [../README.md](../README.md) | Project overview, stack, team, module scope |
| [../README_install_and_start.md](../README_install_and_start.md) | Setup, local development, Docker demo/evaluation, shutdown, troubleshooting |
| [architecture.md](architecture.md) | Current architecture and folder reference |

If another document contradicts one of these, prefer the canonical document.

## Useful Support Documents

These documents can still be useful, but they are not startup sources of truth:

| Path | Notes |
|---|---|
| [modules.md](modules.md) | 42 module planning/reference |
| [team-organization.md](team-organization.md) | Team process notes |
| [git-commands-guide.md](git-commands-guide.md) | Git workflow help |
| [git-organization.md](git-organization.md) | Git organization notes |
| [Role_par_fichier.md](Role_par_fichier.md), [ownership-migration.md](ownership-migration.md), [organisation_role_push.md](organisation_role_push.md), [Martin_role.md](Martin_role.md) | Ownership and role notes; may overlap |
| [project-cleanup-audit.md](project-cleanup-audit.md) | Historical cleanup audit snapshot |
| [dev-mode-check.md](dev-mode-check.md) | Historical local startup check |
| [ticket.txt](ticket.txt) | Historical ticket/planning notes |
| [42 EvalHub.pdf](42%20EvalHub.pdf), [ft_transcendence.subject.pdf](ft_transcendence.subject.pdf) | Evaluation and subject references |

## Historical And Supporting Note Folders

These folders are kept for team memory. They should not be used as current setup or architecture references unless they are explicitly updated and linked from the canonical docs.

| Folder | Purpose |
|---|---|
| `../backend_doc/` | Backend implementation notes |
| `../frontend_doc/` | Frontend implementation notes |
| `../background_doc/` | Background technical notes |
| `../history_debug/` | Debugging history |
| `../PedagoGamePlay/` | Pedagogical gameplay notes |
| `../probleme_rencontre/` | Historical problem/correction notes |
| `proposition_mvp_kickoff/` | Earlier MVP proposal material |

## Review Rule

When updating startup, workflow, or architecture information:

1. Update the canonical document first.
2. Link historical notes only when they still add context.
3. Do not duplicate startup commands in multiple places.
