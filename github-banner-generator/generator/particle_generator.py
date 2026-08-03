import random
from typing import List, Tuple


class ParticleGenerator:
    def __init__(self, width: int = 1280, height: int = 480):
        self.width = width
        self.height = height

    def build_particles(self, count: int, x0: int, y0: int, x1: int, y1: int) -> List[Tuple[int, int]]:
        particles = []
        rows = int(count ** 0.5)
        cols = rows
        dx = (x1 - x0) / (cols - 1)
        dy = (y1 - y0) / (rows - 1)
        for row in range(rows):
            for col in range(cols):
                x = x0 + col * dx
                y = y0 + row * dy + (col % 2) * 3
                particles.append((int(x), int(y)))
        return particles[:count]

    def to_svg_circles(self, points, radius: float, fill: str, opacity: float, delay_step: float = 0.0) -> str:
        nodes = []
        for idx, (x, y) in enumerate(points):
            delay = idx * delay_step
            nodes.append(
                f"<circle cx='{x}' cy='{y}' r='{radius}' fill='{fill}' opacity='{opacity}'>"
                f"<animate attributeName='opacity' values='{opacity};{opacity*0.24};{opacity}' dur='12s' begin='{delay}s' repeatCount='indefinite'/>"
                f"</circle>"
            )
        return ''.join(nodes)
