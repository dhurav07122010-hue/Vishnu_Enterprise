---
name: Imported artifact not registered with platform
description: listArtifacts()/listWorkflows() return empty even though artifact.toml and source files already exist on disk
---

Symptom: `artifacts/<slug>/.replit-artifact/artifact.toml` and full source
already exist (e.g. from a prior session or import), but `listArtifacts()` and
`listWorkflows()` both return `[]`, and `WorkflowsRestart` fails with
"workflow doesn't exist". `createArtifact()` also fails with
`ARTIFACT_DIR_EXISTS` since the directory is already there, so it can't be
used to (re-)register.

Fix: call `verifyAndReplaceArtifactToml({ tempFilePath, artifactTomlPath })`
with a temp copy of the *same, unchanged* artifact.toml content. Writing the
toml back through that validated path is what triggers the platform to
(re-)discover and register the artifact + its workflows — even when nothing
in the file actually changed.

**Why:** The platform's artifact/workflow registry is a separate side-table
from the on-disk `.replit-artifact/artifact.toml`; disk state persisting
across a fresh container doesn't automatically re-populate that registry.

**How to apply:** If `listArtifacts()`/`listWorkflows()` are unexpectedly
empty in a project that clearly has existing `artifacts/*/.replit-artifact/`
directories, do this registration nudge for each artifact before concluding
the project needs a full re-scaffold or multi-artifact migration.
