from dataclasses import dataclass


@dataclass
class Theme:
    name: str
    background_color: str
    panel_color: str
    border_color: str
    text_color: str
    muted_text: str
    primary_accent: str
    success_accent: str
    particle_color: str
    glow_color: str
    defs: str = ''
    background: str = ''


class ThemeBuilder:
    def __init__(self, name: str):
        self.name = name

    def build(self) -> Theme:
        if self.name == 'light':
            return Theme(
                name='light',
                background_color='#F8FAFC',
                panel_color='#F1F5F9',
                border_color='#0F172A',
                text_color='#0F172A',
                muted_text='#64748B',
                primary_accent='#2563EB',
                success_accent='#059669',
                particle_color='#0F172A',
                glow_color='#7DD3FC',
                defs=self.build_defs('light'),
                background=self.build_background('#F8FAFC'),
            )

        return Theme(
            name='dark',
            background_color='#09090B',
            panel_color='#111827',
            border_color='#22D3EE',
            text_color='#F8FAFC',
            muted_text='#94A3B8',
            primary_accent='#3B82F6',
            success_accent='#10B981',
            particle_color='#7DD3FC',
            glow_color='#22D3EE',
            defs=self.build_defs('dark'),
            background=self.build_background('#09090B'),
        )

    def build_defs(self, theme_name: str) -> str:
        return f"""
      <linearGradient id='panelGradient' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='{self.panel_color}' stop-opacity='0.92'/>
        <stop offset='100%' stop-color='{self.panel_color}' stop-opacity='0.82'/>
      </linearGradient>
      <radialGradient id='glowGradient'>
        <stop offset='0%' stop-color='{self.glow_color}' stop-opacity='0.55'/>
        <stop offset='100%' stop-color='{self.glow_color}' stop-opacity='0'/>
      </radialGradient>
      <filter id='softGlow' x='-40%' y='-40%' width='180%' height='180%'>
        <feGaussianBlur stdDeviation='5' result='blur'/>
        <feMerge>
          <feMergeNode in='blur'/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>
      <filter id='shadow' x='-20%' y='-20%' width='140%' height='140%'>
        <feDropShadow dx='0' dy='12' stdDeviation='18' flood-color='#000000' flood-opacity='0.18'/>
      </filter>
    """

    def build_background(self, color: str) -> str:
        return f"<rect x='0' y='0' width='1280' height='480' fill='{color}'/>"
