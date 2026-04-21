# Reference Fitness to Up-Final Field Mapping

This document defines the canonical field mapping from `reference-app-fitness` to `up-final`.
The goal is to keep the migration deterministic, type-safe, and ready for leaderboard filtering
without introducing unstable ad-hoc fields.

## Scope and principles

- Source app: `reference-app-fitness` (read-only reference).
- Target app: `up-final` only.
- Leaderboard writes stay summary-only (cost guardrail): no bulky per-test raw payload in ladder rows.
- Keep user-entered raw values in profile storage; derive filter buckets in pure logic.

## Storage model in up-final

- Local profile draft (authoritative user input): local storage profile object.
- Leaderboard entry projection: `leaderboards/{metric}/entries/{uid}` summary fields for filtering.
- Cloud backup (`users/{uid}/artifacts/up_cloud_sync_v1`) remains independent from leaderboard shards.

## Mapping table (name + type + migration notes)

| reference-app-fitness field | up-final field | up-final type | required | migration notes |
| --- | --- | --- | --- | --- |
| `gender` | `gender` | `'male' \| 'female'` | yes | Already in physical profile. |
| `age` | `age` | `number` | yes | Whole years; keep validated bounds from profile rules. |
| `height` | `heightCm` | `number` | yes | Normalize to cm naming used by `up-final`. |
| `weight` | `weightKg` | `number` | yes | Normalize to kg naming used by `up-final`. |
| `job_category` | `jobCategory` | `LadderJobCategory \| ''` | optional | Use normalized enum key, avoid localized labels in storage. |
| `weeklyTrainingHours` | `weeklyTrainingHours` | `number \| null` | optional | Nullable when not provided; no string persistence. |
| `trainingYears` | `trainingYears` | `number \| null` | optional | Nullable when not provided; decimal allowed. |
| `country` | `countryCode` | `LadderCountryCode \| ''` | optional | Prefer ISO-like short code (`TW`, `US`, ...). |
| `city` | `city` | `string` | optional | Free text or controlled list value. |
| `district` | `district` | `string` | optional | Usually used with TW city flow. |
| `region` | `region` | `string` | optional | Keep for non-TW administrative region. |
| `isAnonymousInLadder` | `isAnonymousInLadder` | `boolean` | optional | Defaults to `false`. |
| `filter_weightClass` | `weightBucket` | `LadderWeightBucket` | derived | Do not store user input string directly; derive from `weightKg`. |
| `filter_job` | `jobCategory` | `LadderJobCategory \| ''` | optional | Legacy duplicate; collapse into one canonical field. |
| derived age grouping | `ageBucket` | `LadderAgeBucket` | derived | Derive from `age` in pure logic. |
| derived height grouping | `heightBucket` | `LadderHeightBucket` | derived | Derive from `heightCm` in pure logic. |
| region-level filter state (`country/city/district`) | `regionScope` | `LadderRegionScope` | derived | Optional cached scope for fast UI filtering. |

## Canonical naming decisions

- `heightCm`, `weightKg`: keep unit in name for zero ambiguity.
- `countryCode`: explicit semantics and safer for i18n migrations.
- `jobCategory`: single canonical profession key.
- `*Bucket`: reserved suffix for derived filter classes.

## Recommended migration sequence

1. Add stable types/constants (`src/types/ladderProfile.ts`).
2. Extend local profile schema and save/load functions.
3. Add pure derivation utilities for `ageBucket/heightBucket/weightBucket/regionScope`.
4. Project summary fields when submitting leaderboard score.
5. Update ladder hook/UI to consume canonical fields only.

## Non-goals

- No direct copy of `users`-table leaderboard query design from reference app.
- No mixed legacy aliases in final write path.
- No localized display text persisted as filter source-of-truth.
