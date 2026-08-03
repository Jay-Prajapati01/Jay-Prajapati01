from typing import List


def build_info_row(label: str, value: str, x: int, y: int, accent: str, text_color: str, muted: str) -> str:
    return f"""
    <text x='{x}' y='{y}' fill='{muted}' font-family='Inter, ui-sans-serif, system-ui, sans-serif' font-size='12' letter-spacing='0.3'>
      {label}
    </text>
    <text x='{x}' y='{y+18}' fill='{text_color}' font-family='Inter, ui-sans-serif, system-ui, sans-serif' font-size='15' letter-spacing='0.2'>
      {value}
    </text>
    """


class TerminalBuilder:
    def __init__(self, theme):
        self.theme = theme

    def build_terminal(self) -> str:
        panel = self.build_panel()
        title = self.build_title()
        info = self.build_info_block()
        return f"""
    <g id='terminal-window'>
      {panel}
      {title}
      {info}
    </g>
    """

    def build_panel(self) -> str:
        return f"""
      <rect x='32' y='42' width='1216' height='396' rx='18' ry='18' fill='url(#panelGradient)' stroke='{self.theme.border_color}' stroke-width='1.4' filter='url(#shadow)' />
      <rect x='36' y='46' width='1208' height='60' rx='14' ry='14' fill='{self.theme.panel_color}' opacity='0.94' />
      <circle cx='64' cy='76' r='7' fill='#F97316' />
      <circle cx='92' cy='76' r='7' fill='#FCD34D' />
      <circle cx='120' cy='76' r='7' fill='#34D399' />
    """

    def build_title(self) -> str:
        return f"""
      <text x='160' y='80' fill='{self.theme.text_color}' font-family='Inter, ui-sans-serif, system-ui, sans-serif' font-size='14' font-weight='600'>profile.sh --live</text>
    """

    def build_info_block(self) -> str:
        rows = []
        data = [
            ('Subject', 'Jay Prajapati'),
            ('Role', 'AI Engineer'),
            ('Location', 'Ahmedabad, India'),
            ('Status', 'Building AI Products'),
            ('Focus', 'MindMesh / ProductionHub / JarvisX / TechyDoseHub'),
            ('Languages', 'C++, Python, TypeScript'),
            ('Frontend', 'Next.js, React'),
            ('Backend', 'FastAPI, Node.js'),
            ('Database', 'PostgreSQL, Redis, Qdrant'),
            ('Infrastructure', 'Docker, AWS, Cloudflare, Vercel'),
        ]
        x = 64
        y = 118
        for label, value in data:
            rows.append(build_info_row(label, value, x, y, self.theme.primary_accent, self.theme.text_color, self.theme.muted_text))
            y += 44
        return ''.join(rows)
