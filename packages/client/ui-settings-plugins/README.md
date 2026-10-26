---
description: "Plugin market settings section for the dsh web client: the Settings navigation entry and the tab chrome that feature-owned tabs register into."
kind: "package-reference"
---

# @deepseek-ai/dsh-client-ui-settings-plugins

English | [中文](README.zh.md)

## Summary

**Plugin market** owns a shared search field above horizontal category navigation. Discover contributes third-party plugins, while inventory contributes separate Session and Global views. Switching categories preserves search and visited-page state, supports arrow keys, Home, and End, and briefly joins or separates the navigation surfaces; reduced motion keeps them static.

Keyboard focus follows each tab's existing rounded silhouette, and a short one-pixel press response confirms activation without shifting the layout. Reduced motion removes the displacement.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

Open **Plugin market** in Settings. Its categories are third-party, Session, and Global plugins, in that order; third-party appears when the deployment enables plugin indexes and management. A lone contribution renders directly, and no contributions produce an empty state.

To contribute a tab, register into `settings.plugins.tab` with an `id`, an `order`, and a localized `label`; the section renders the entries in order and mounts a tab on its first selection. Feature copy stays in the registering plugin's dictionary.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The section declares `settings.plugins.tab`, a root list slot whose labels become ordered tabs; a lone contribution renders as the page itself, and a tab stays mounted after its first selection so search and the inventory snapshot survive switching. The section's `inject` projects the slot's ledger into ordered rows whose labels follow the active locale, cached until the ledger version or the locale revision moves. The Host half is an empty `apply`, present only so the package holds a Loader row the client module system serves the browser half for.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [ui-settings-plugin-inventory](../ui-settings-plugin-inventory/README.md) — the read-only inventory tab.
- [ui-settings](../ui-settings/README.md) — the domain base declaring `settings.section`.
- [ui-plugin-manager](../ui-plugin-manager/README.md) — the Plugins page where official plugins are configured.
- [ui-settings-shell](../ui-settings-shell/README.md), [ui-settings-agent-loop](../ui-settings-agent-loop/README.md), [ui-settings-subagent](../ui-settings-subagent/README.md), [ui-settings-web-search](../ui-settings-web-search/README.md) — the official configuration pages, one companion package each.

-----

<a id="model-experience"></a>
## Model Experience

None, as the package is a browser-side settings surface that registers no model surface.

#### KV Cache effect

None; this package neither assembles nor sends a provider request.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

- **The section has no tab of its own** — it renders its empty line until a feature plugin registers one; the shell cannot fill the section alone.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
