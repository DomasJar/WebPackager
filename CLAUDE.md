# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page Vue 3 web app that packages Minecraft Bedrock skin packs into a distributable `.zip`. Users upload skin PNGs and marketing art (JPEGs), the app validates/classifies them client-side, and it produces a zip containing `manifest.json`, `skins.json`, language files, and the marketing art in the layout the Marketplace expects. Everything runs in the browser — there is no backend other than Firebase Auth.

## Commands

Package manager is **yarn** (see `.yarnrc.yml`, `deploy.sh`); a `package-lock.json` also exists but yarn is the one actually used for build/deploy.

- `yarn dev` — start the Vite dev server
- `yarn build` — type-check with `vue-tsc` then build with Vite (this is the only type-checking step; there is no separate `tsc --noEmit`/lint script)
- `yarn preview` — preview the production build locally
- `yarn deploy` — runs `deploy.sh`: builds, then force-pushes `dist/` to the `gh-pages` branch of the GitHub repo (destructive/remote — confirm with the user before running)

There is no test suite and no linter configured in this repo.

## Architecture

- **Entry**: `src/main.ts` mounts `App.vue` with the router and Vuetify plugin. `App.vue` is just a `v-app`/`v-main` shell around `<router-view>`.
- **Routing** (`src/router.ts`): routes are `/WebPackager` (main packager), `/WebPackager/login`, `/WebPackager/register`, and a catch-all 404. A `beforeEach` guard checks `meta.requiresAuth`/`requiresGuest`, but the packager route currently sets `requiresAuth: false`, so auth is not actually enforced on the main flow even though `Login.vue`/`Register.vue`/`firebase.ts` (Firebase Auth) exist and are wired up.
- **Core logic lives almost entirely in `src/components/SkinPackager.vue`** — a large single-file component with no separate store/service layer. Key pieces inside it:
  - **Image intake** (`sortImages`, `handleFileChange`, drag-and-drop `onDrop`/`dragstart`): PNGs are treated as skins, JPEGs as marketing/store art. Marketing art is validated by exact pixel dimensions (Store Art auto-derives from 1920x1080 Marketing Art via `resizeImg` to 800x450; Partner Art also requires 1920x1080). Non-JPEG art is converted via `changeImgFormat` (draws to an offscreen `<canvas>` and re-encodes).
  - **Skin classification** (`getSkinType`): draws the uploaded skin onto the hidden `#myCanvas` canvas and inspects specific pixel regions (arm/hand areas) for alpha to decide `"custom"` (wide arms) vs `"customSlim"` (slim arms) skin geometry — this pixel-region logic is the trickiest part of the file if you need to change skin-format detection.
  - **Zip assembly** (`generateZip`/`packageSkins`): builds `manifest.json` (with per-run `uuid`s), `skins.json`, an `en_US.lang` file, and `languages.json`, then packs everything plus skin PNGs and marketing art into a JSZip archive matching Bedrock skin pack directory conventions (`Content/skin_pack/...`, `Store Art/...`, `Marketing Art/...`), and triggers a browser download via `file-saver`.
  - Partner Art is persisted to `localStorage` (`partner_art`) and restored on mount via `dataURLtoFile`, since it tends to be reused across packs.
  - Reordering/naming skins (drag-drop order determines the numeric file prefix used in the pack) is handled by `vuedraggable`.
- **3D preview**: two separate Three.js-based viewers exist for previewing a skin on the humanoid model —`ModelView.vue` (inline preview per skin card, built on the `troisjs` Vue wrapper) and `ModelViewerDialog.vue` (modal preview with `OrbitControls`, built on raw `three`). Both load the same baked glTF models from `src/assets/model_custom.json` (wide arms) / `model_customSlim.json` (slim arms) as in-memory blob URLs and swap in the uploaded skin as a texture at runtime.
- **Firebase** (`src/firebase.ts`) provides Auth and Analytics; config/keys are committed in this file as-is (it's a public Firebase web config, not a server secret).
- Vuetify is configured in `src/plugins/vuetify.ts` (dark theme by default, MDI icons) and built via `vite-plugin-vuetify` with SCSS settings from `src/styles/settings.scss`.
- The Vite `base` is `/WebPackager/` (GitHub Pages project-site path), which is why routes are prefixed with `/WebPackager`.
