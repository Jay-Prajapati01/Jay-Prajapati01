# GitHub Banner Generator

This project produces two pure SVG GitHub banner themes: `dark.svg` and `light.svg`.

## Project structure

- `assets/`
  - `portrait.png` — source portrait asset
  - `td-logo.svg` — TechyDoseHub logo vector source
  - `ai-brain.svg` — AI Brain logo vector source
- `generator/`
  - `portrait_processor.py` — portrait preprocessing pipeline
  - `logo_vectorizer.py` — logo vector templates and helpers
  - `particle_generator.py` — particle layout generator
  - `point_matcher.py` — matching utilities
  - `animation_engine.py` — SVG animation builder
  - `terminal_builder.py` — terminal panel builder
  - `theme_builder.py` — theme definitions and color system
  - `export.py` — entrypoint to generate `dark.svg` and `light.svg`
- `output/`
  - `dark.svg`
  - `light.svg`
- `requirements.txt`

## Build instructions

1. Install dependencies:

```bash
python -m pip install pillow
```

2. Place your assets in `assets/`:

- `portrait.png`
- `td-logo.svg`
- `ai-brain.svg`

3. Generate the SVG banners:

```bash
python generator/export.py
```

4. Copy `output/dark.svg` and `output/light.svg` into your repository root or GitHub profile.

## Integration snippet for `README.md`

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./github-banner-generator/output/dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./github-banner-generator/output/light.svg">
  <img alt="Jay Prajapati" src="./github-banner-generator/output/light.svg">
</picture>
```

## Notes

- The generator uses SVG SMIL animations only.
- No JavaScript, Canvas, GIF, or external runtime libraries are required.
- The project is built to keep the final SVG files under 1MB by reusing gradients and limiting node complexity.
