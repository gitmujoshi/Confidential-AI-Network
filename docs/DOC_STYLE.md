# Documentation style (Google-inspired)

How we keep `docs/` navigable. Inspired by [Google developer documentation style](https://developers.google.com/style) and [Diátaxis](https://diataxis.fr/).

## Principles

1. **One canonical page per topic.** Do not copy the same guide into multiple folders.
2. **Four page types** (Diátaxis):
   - **Tutorial** — learn by doing (QUICK_START, LOCAL_DEMO_RUNBOOK)
   - **How-to** — accomplish a task (PARTICIPANT_ONBOARDING_AND_E2E_LIFECYCLE, signing user guide)
   - **Reference** — accurate lookup (API_REFERENCE, DATA_MODEL, GLOSSARY)
   - **Explanation** — design rationale (ARCHITECTURE, CAN_GAP_DECISION_MEMO, security architectures)
3. **Hub, don’t sprawl.** `docs/README.md` is the only documentation home. No second “index” or “MAIN_README”.
4. **Thin redirects only.** If a path moves, leave a short “Moved” stub (≤15 lines) or archive it under `archive/`.
5. **Archive is not canonical.** Anything under `docs/archive/` is historical. Link to it only when discussing history.
6. **Code is source of truth for schemas.** Doc field lists must match models/routes; mark design-only clearly.
7. **Name roles consistently.** Prefer **TSP** in new docs; note **CCRP** as UI/legacy synonym once (see [GLOSSARY.md](GLOSSARY.md)).
8. **DEPA** always means India’s **iSPIRT** **Data Empowerment and Protection Architecture** ([depa.world](https://depa.world)). Never expand it as “Decentralized Entity Provider Architecture” or as the DPDP Act. Use [GLOSSARY.md](GLOSSARY.md) as the canonical definition.
9. **State maturity.** Shipped / MVP / design — never imply production TEE if only simulated.

## Where new docs go

| Kind | Location |
|------|----------|
| Tutorial | `getting-started/` or `training/` |
| Product how-to | `guides/` or `features/<area>/` |
| API / schema reference | `api/` or `architecture/` |
| Design / trust model | `architecture/`, `features/can/`, `security/`, `production/` |
| Deploy readiness | `deployment/` + `production/` |
| Historical write-up | `archive/` (with reason in commit message) |

**Do not** add new top-level files under `docs/` except the hub set: `README`, `DOC_STYLE`, `GLOSSARY`, `USER_GUIDE`, `ADMIN_GUIDE`, `DEVELOPER_GUIDE`, `ARCHITECTURE`.

## Writing rules

- Lead with the task or decision; put background below.
- Prefer tables for attributes, maturity, and “go here if…”.
- Link to the canonical page instead of pasting sections.
- Date “Last updated” on living hubs when you change them.
- Avoid emoji-heavy headings in new material (existing docs may retain them until edited).

## Contract signing (example of slim set)

Canonical (keep):

- Overview · User guide · Technical reference · SCITT integration · Index

Historical (under `archive/contract-signing/`):

- Implementation plan / summary / strategy / duplicate architecture

## Review checklist

Before merging doc changes:

- [ ] Linked from [README.md](README.md) if it is a new canonical page
- [ ] No duplicate full copy of an existing guide
- [ ] Portal vs CAN path called out where trust models differ
- [ ] Archive or stub anything you supersede
