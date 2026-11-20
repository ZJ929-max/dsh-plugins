# AI disclosure

This repository is a distribution layer, not a plugin implementation. Its files were drafted by an AI coding agent running inside DeepSeek Harness, under human direction.

What that means concretely:

- `package.json`, `patches/*.yml`, `index.json`, the CI files, and these documents were written in a human–agent dialogue.
- The four patch files are **copies** of the insert blocks in the plugins' own `cordis.patch.yml`. They were compared field-by-field against the plugin repositories at the commits named in each patch header; the comparison method and result are recorded in `DESIGN-NOTES.md`.
- `index.json` was validated with the `@deepseek-ai/dsh-plugin-market-index` parser shipped in DSH 0.2.2-rc.3, and the dependency specs were checked with the `@deepseek-ai/dsh-plugin-manager` install-spec parser.
- No plugin source code was modified by this repository.

What it does not mean:

- It is not a claim that the bundle installs cleanly end to end. That test is listed as pending in `DESIGN-NOTES.md` because the GitHub repositories did not exist when this draft was written.
- It is not a substitute for reading the plugins' own disclosures. `dsh-agent-bus` is high privilege by design; `dsh-view-image` invokes external decoders; `dsh-bili-peek` makes network requests when called.
- Where a number or a URL is quoted, it came from the repository state at the time of writing; commits are pinned so the quotes stay checkable.

If you find a defect in this layer, please open an issue with the exact command and the observed output. Defects in a plugin belong in that plugin's repository.
