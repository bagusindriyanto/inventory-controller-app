# Architecture

The application is being migrated incrementally to a feature-first structure.
Each migration should preserve existing behavior and keep the project buildable.

## Target boundaries

- `src/app`: application composition and providers.
- `src/features/<feature>/domain`: pure business rules and domain-owned types.
- `src/features/<feature>/application`: use cases, orchestration, and boundary
  mapping.
- `src/features/<feature>/api`: external APIs, workers, and adapters.
- `src/features/<feature>/components`: feature-specific presentation.
- `src/components/ui`: shared shadcn primitives.
- `src/components`: shared application components only.
- `src/lib`: small shared, framework-agnostic utilities.
- `src/config`: validated runtime configuration.

## Dependency direction

Feature components may depend on their application and domain layers. The
application layer coordinates domain rules through contracts. Infrastructure
implements external concerns behind those contracts. Domain modules must remain
pure and must not import React, browser APIs, remote clients, or presentation
components.

## Migration rules

1. Migrate one vertical feature slice at a time.
2. Do not rewrite shadcn primitives as part of feature migrations.
3. Introduce domain-shaped inputs at boundaries instead of leaking spreadsheet
   column names into business rules.
4. Run typecheck, lint, and build after every slice.
5. Add automated tests before changing business-rule behavior.
