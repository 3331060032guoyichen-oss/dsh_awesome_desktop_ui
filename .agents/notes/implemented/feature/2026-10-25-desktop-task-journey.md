# Agent Note: Desktop task journey

Status: implemented

English | [中文](2026-10-25-desktop-task-journey.zh.md)

## Problem

The desktop trajectory mixes user requests with system prompts, runtime context, tool arguments, and timing metrics. Its dense ledger makes ordinary task progress difficult to understand.

## Decision

Desktop studio defaults to a vertical Task journey built from the existing trajectory projection. It displays user requests, assistant responses, and tool actions; recorded tool descriptions become action headings. Search keeps the matching turn intact. Full content expands inline, and Inspect record selects the corresponding original ledger record. Explicit call-focus requests open Technical records directly.

The feed shows six recent loaded turns and exposes earlier history on demand. It reports recorded action counts and actual running/error facts; missing tool results remain unknown. It does not infer a plan or manufacture a completion percentage. System/context rows remain available in Technical records. Other clients keep their original default view.

## Alternatives considered

A restyled ledger preserves density but does not reduce the user's interpretation work. Replacing the inspector loses valuable diagnostic access. Model-generated summaries add latency and can misrepresent recorded actions; the feed instead uses existing recorded descriptions and content.

## Consequences

Users get a readable process view without a second event store or session format. The original timeline, search, and inspector remain available. Technical tool names can still appear when no human-readable description is recorded. The action count covers loaded history only, and the feed does not promise an overall task-completion state.

## Verification

The story component suite covers requests, actions, results, failures, live calls, missing results, search, and inspector navigation. The built desktop scenario checks story/record switching and viewport overflow at 390, 600, and 1680 pixels.
