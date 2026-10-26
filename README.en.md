<p align="center"><img src="assets/readme/whale.png" width="88" alt="The Klein blue and ivory whale seal"></p>

# DSH Awesome Desktop UI

**An illustrated desktop, quiet motion, and an Agent workflow people can follow.**

[中文](README.md) · [Releases](https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/releases) · [Design references](README.md#设计参考与致谢) · [MIT](LICENSE)

![The illustrated desk homepage](assets/readme/home.png)

An unofficial desktop UI redesign of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), keeping its plugin architecture while redesigning the daily journey from opening the app to understanding an Agent's work.

## The experience

- A four-piece whale seal assembles from the wrong quadrants and dissolves into a forward camera approach.
- The homepage character breathes quietly; hair and leaves move occasionally. Subtle pointer parallax returns smoothly to center without deforming rigid objects.
- Clicking the manuscript advances into an overhead conversation view. The composer stays docked and drafts survive returning to the desk.
- A pointer reveal exposes the same Session's trajectory. Its wheel gestures scroll the revealed content rather than moving the page.
- The full trajectory uses Swiss-inspired hierarchy, a Klein blue grid, and ivory text so non-engineers can follow requests, actions, and results.
- Settings brings together account usage, a searchable three-category plugin market, and animated provider cards inside a branded wallet sleeve.
- Light, Dark, and System preferences work throughout the desktop. Reduced motion and native text selection remain supported.

## Video

<video controls width="100%" src="https://raw.githubusercontent.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/v1.0.0/assets/readme/demo.mp4"></video>

[Watch or download the full desktop recording (1:53)](https://raw.githubusercontent.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/v1.0.0/assets/readme/demo.mp4).

## Screenshots

![The readable trajectory view](assets/readme/trajectory.png)
![The three-category plugin market](assets/readme/market.png)
![The model wallet in dark mode](assets/readme/models-dark.png)
![Account usage with demonstration data](assets/readme/account.png)

Screenshots come from the running client and use demonstration account, model, or usage data. No account credentials or personal bills are distributed.

## Run

Check [Releases](https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui/releases) for available Windows x64 installers. If a release contains source only, use Node.js 24.9+, Git, and the repository's pinned pnpm:

```powershell
git clone https://github.com/3331060032guoyichen-oss/dsh_awesome_desktop_ui.git
cd dsh_awesome_desktop_ui
corepack enable
pnpm install --frozen-lockfile
pnpm run build
pnpm run start:desktop
```

Sign in with your own DeepSeek account or configure a model provider in Settings. The UI release is **v1.0.0**; the underlying Harness runtime is **0.2.1-rc.3**. Extended usage statistics require the `dsh-usage-stats` service. Third-party discovery requires enabling the custom plugin index bundle; its default source is `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json`.

## References and credits

The [complete design reference table](README.md#设计参考与致谢) explains each influence: DeepSeek Harness, illoca, Rare UI's Hook Sidebar / Gooey Nav / AI Status / Grid Reveal, Token Pass Intro Animation, Vibe Selector, the community effort slider, dsh-usage-stats, and Awesome DSH Plugin.

The whale composition, illustrated homepage, camera handoff, natural idle state, pointer trajectory reveal, themes, and interaction details were adapted specifically for this desktop. Reference-site promotional artwork is not redistributed.

## License

[MIT](LICENSE), retaining upstream and dependency notices. This is an unofficial UI project; references do not imply endorsement. The original documentation remains in [README.upstream.md](README.upstream.md).
