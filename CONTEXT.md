# WebPackager

A browser-only tool for assembling Minecraft Bedrock skin packs (skins + marketing art) into a Marketplace-ready zip.

## Language

**Partner Art**:
The 1920x1080 marketing image representing the pack's partner/brand, used as one of the three marketing art slots in a skin pack submission (alongside Store Art and Marketing Art/Key Art HD).

**Partner Art History**:
The most-recently-used, content-deduplicated list of Partner Art images a user has previously selected, capped at a fixed size (oldest evicted first). Selecting an entry sets it as the active Partner Art; removing an entry deletes it from history and, if it was the active Partner Art, clears the active slot too. Persisted in IndexedDB so it survives page reloads.
_Avoid_: Recent Partner Art, Saved Partner Art, Partner Art Library

**Pack Draft**:
The in-progress, auto-persisted state of the skin pack currently being assembled: pack name, version, the ordered skins list, the unplaced Store Images gallery, and Key Art/Marketing Art. Debounce-saved to IndexedDB on every change so a refresh or crash doesn't lose work. Cleared by "Start New Pack". Does not include Partner Art, which is deliberately governed by Partner Art History instead since it's a reusable asset across packs, not per-pack state — "Start New Pack" leaves it untouched.
_Avoid_: Session State, Workspace
