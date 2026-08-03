import os
from theme_builder import ThemeBuilder
from animation_engine import AnimationEngine
from terminal_builder import TerminalBuilder

ROOT = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(ROOT, '..', 'output')


def ensure_output():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def main():
    ensure_output()

    portrait_path = os.path.join(ROOT, '..', 'assets', 'portrait.png')
    td_logo_path = os.path.join(ROOT, '..', 'assets', 'td-logo.svg')
    ai_logo_path = os.path.join(ROOT, '..', 'assets', 'ai-brain.svg')

    # Build the SVG structure for both themes.
    for theme_name in ('dark', 'light'):
        theme = ThemeBuilder(theme_name).build()
        terminal = TerminalBuilder(theme).build_terminal()
        animation = AnimationEngine(theme).build_animation()

        svg = f"""
<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 480' width='1280' height='480'>
  <defs>
    {theme.defs}
  </defs>
  <g id='canvas'>
    {theme.background}
    {terminal}
    {animation}
  </g>
</svg>
"""
        out_path = os.path.join(OUTPUT_DIR, f'{theme_name}.svg')
        with open(out_path, 'w', encoding='utf-8') as f:
            f.write(svg)
        print(f'Wrote {out_path}')


if __name__ == '__main__':
    main()
