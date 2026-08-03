from math import sqrt
from typing import List, Tuple


class PointMatcher:
    def match_points(self, source: List[Tuple[float, float]], target: List[Tuple[float, float]]) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        if not source or not target:
            return []
        matched = []
        for i, s in enumerate(source):
            t = target[i % len(target)]
            matched.append((s, t))
        return matched

    def kdtree_match(self, source: List[Tuple[float, float]], target: List[Tuple[float, float]]) -> List[Tuple[Tuple[float, float], Tuple[float, float]]]:
        return self.match_points(source, target)
