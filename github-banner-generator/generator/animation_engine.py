from typing import List


class AnimationEngine:
    def __init__(self, theme):
        self.theme = theme

    def build_animation(self) -> str:
        portrait_layer = self.build_portrait_layer()
        logo_particles = self.build_logo_particles()
        motion = self.build_motion_elements()
        return f"""
    <g id='animation-group'>
      {portrait_layer}
      {logo_particles}
      {motion}
    </g>
    """

    def build_portrait_layer(self) -> str:
        return f"""
      <g id='portrait-layer'>
        <circle cx='360' cy='260' r='148' fill='{self.theme.particle_color}' opacity='0.06'>
          <animate attributeName='opacity' values='0.05;0.10;0.05' dur='12s' repeatCount='indefinite'/>
        </circle>
        <g id='portrait-particles'>
          {self.build_particle_grid(280, 120, 18, 18, 0.06)}
        </g>
      </g>
    """

    def build_particle_grid(self, start_x: int, start_y: int, cols: int, rows: int, base_opacity: float) -> str:
        particles = []
        size = 2.5
        for row in range(rows):
            for col in range(cols):
                x = start_x + col * 10
                y = start_y + row * 9
                delay = (row + col) * 0.03
                particles.append(f"<circle cx='{x}' cy='{y}' r='{size}' fill='{self.theme.particle_color}' opacity='{base_opacity}'>"
                                  f"<animate attributeName='cy' values='{y};{y-1.2};{y}' dur='7.8s' begin='{delay}s' repeatCount='indefinite' />"
                                  f"<animate attributeName='opacity' values='{base_opacity};{base_opacity+0.06};{base_opacity}' dur='11.6s' begin='{delay}s' repeatCount='indefinite' />"
                                  f"</circle>")
        return ''.join(particles)

    def build_logo_particles(self) -> str:
        particles = []
        for i in range(22):
            x = 700 + (i % 11) * 22
            y = 180 + (i // 11) * 22
            idx = i + 1
            particles.append(f"<circle cx='{x}' cy='{y}' r='3.2' fill='{self.theme.primary_accent}' opacity='0.82'>"
                             f"<animate attributeName='cx' values='{x};{x-12};{x}' dur='10.8s' begin='{idx * 0.21}s' repeatCount='indefinite' />"
                             f"<animate attributeName='cy' values='{y};{y+7};{y}' dur='8.8s' begin='{idx * 0.19}s' repeatCount='indefinite' />"
                             f"<animate attributeName='opacity' values='0.78;0.34;0.78' dur='9.6s' begin='{idx * 0.18}s' repeatCount='indefinite' />"
                             f"</circle>")
        return f"<g id='logo-particles'>{''.join(particles)}</g>"

    def build_motion_elements(self) -> str:
        return f"""
      <g id='motion-accents'>
        <path d='M 538 130 C 620 90 720 90 802 130' fill='none' stroke='{self.theme.glow_color}' stroke-width='1.6' opacity='0.32'>
          <animate attributeName='stroke-opacity' values='0.32;0.10;0.32' dur='13s' repeatCount='indefinite'/>
        </path>
        <path d='M 548 340 C 630 300 730 300 812 340' fill='none' stroke='{self.theme.glow_color}' stroke-width='1.6' opacity='0.28'>
          <animate attributeName='stroke-opacity' values='0.28;0.1;0.28' dur='11s' repeatCount='indefinite'/>
        </path>
      </g>
    """
