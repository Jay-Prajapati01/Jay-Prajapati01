from xml.etree.ElementTree import Element, SubElement, tostring


class LogoVectorizer:
    def __init__(self, name: str):
        self.name = name

    def build_sample_logo(self) -> str:
        if self.name == 'td':
            return self.build_td_logo()
        return self.build_ai_logo()

    def build_td_logo(self) -> str:
        return '''
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 80'>
  <path d='M12 72 L40 16 H68 L96 72 H80 L72 56 H28 L20 72 Z' fill='#22D3EE'/>
  <path d='M112 24 H148 L166 48 Q168 52 164 56 L136 72 H116 V24 Z' fill='#3B82F6'/>
  <path d='M154 24 L172 24 L182 40 L154 40 Z' fill='#0EA5E9'/>
  <text x='6' y='18' fill='#E2E8F0' font-family='Inter, ui-sans-serif' font-size='14'>TechyDoseHub</text>
</svg>
'''

    def build_ai_logo(self) -> str:
        return '''
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 90'>
  <path d='M18 70 C24 32 46 18 78 20 C110 22 126 46 130 72 C108 82 34 84 18 70 Z' fill='#10B981'/>
  <circle cx='64' cy='32' r='5' fill='#F8FAFC'/>
  <circle cx='96' cy='42' r='4.2' fill='#F8FAFC'/>
  <circle cx='78' cy='60' r='3.4' fill='#F8FAFC'/>
  <path d='M54 28 L90 40 L98 64' fill='none' stroke='#22D3EE' stroke-width='2' stroke-linecap='round'/>
</svg>
'''
