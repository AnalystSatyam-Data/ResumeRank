"""
Custom Merge Sort Implementation
==================================
Purpose: Sort candidates by score for ranking.
Stable sort ensuring deterministic ordering.

Time Complexity:
  - Best: O(n log n)
  - Average: O(n log n)
  - Worst: O(n log n)

Space Complexity: O(n)

Tie-breaking:
  1. Higher skill match score first
  2. Higher experience score first
  3. More relevant projects first
"""


class MergeSort:
    """
    Custom Merge Sort implementation for candidate ranking.
    Sorts candidates by final_score descending with deterministic tie-breaking.
    """

    def __init__(self):
        self.steps = []  # Record sorting steps for visualization
        self.comparisons = 0
        self.swaps = 0

    def sort(self, candidates, key="final_score", reverse=True, record_steps=False):
        """
        Sort a list of candidate dictionaries.

        Args:
            candidates: List of dicts with score fields
            key: The field to sort by (default: 'final_score')
            reverse: If True, sort descending (default: True for rankings)
            record_steps: If True, record steps for visualization

        Returns:
            Sorted list of candidates
        """
        self.steps = []
        self.comparisons = 0
        self.swaps = 0

        if len(candidates) <= 1:
            return list(candidates)

        # Create a working copy
        arr = list(candidates)

        if record_steps:
            self.steps.append({
                "type": "initial",
                "data": [{"name": c.get("name", f"C{i}"), "score": c.get(key, 0)} for i, c in enumerate(arr)]
            })

        result = self._merge_sort(arr, key, reverse, record_steps)

        if record_steps:
            self.steps.append({
                "type": "final",
                "data": [{"name": c.get("name", f"C{i}"), "score": c.get(key, 0)} for i, c in enumerate(result)]
            })

        return result

    def _merge_sort(self, arr, key, reverse, record_steps):
        """Recursive merge sort."""
        if len(arr) <= 1:
            return arr

        mid = len(arr) // 2
        left = arr[:mid]
        right = arr[mid:]

        if record_steps:
            self.steps.append({
                "type": "split",
                "left": [{"name": c.get("name", "?"), "score": c.get(key, 0)} for c in left],
                "right": [{"name": c.get("name", "?"), "score": c.get(key, 0)} for c in right]
            })

        left = self._merge_sort(left, key, reverse, record_steps)
        right = self._merge_sort(right, key, reverse, record_steps)

        merged = self._merge(left, right, key, reverse, record_steps)
        return merged

    def _merge(self, left, right, key, reverse, record_steps):
        """Merge two sorted arrays."""
        result = []
        i = j = 0

        while i < len(left) and j < len(right):
            self.comparisons += 1

            left_val = left[i].get(key, 0)
            right_val = right[j].get(key, 0)

            if reverse:
                # Descending order
                if left_val > right_val:
                    result.append(left[i])
                    i += 1
                elif left_val < right_val:
                    result.append(right[j])
                    j += 1
                else:
                    # Tie-breaking
                    if self._compare_tiebreak(left[i], right[j]) <= 0:
                        result.append(left[i])
                        i += 1
                    else:
                        result.append(right[j])
                        j += 1
            else:
                # Ascending order
                if left_val <= right_val:
                    result.append(left[i])
                    i += 1
                else:
                    result.append(right[j])
                    j += 1

            self.swaps += 1

        while i < len(left):
            result.append(left[i])
            i += 1
        while j < len(right):
            result.append(right[j])
            j += 1

        if record_steps:
            self.steps.append({
                "type": "merge",
                "result": [{"name": c.get("name", "?"), "score": c.get(key, 0)} for c in result]
            })

        return result

    def _compare_tiebreak(self, a, b):
        """
        Deterministic tie-breaking for candidates with equal final scores.
        Returns negative if a should come first, positive if b should come first.
        """
        # 1. Higher skill match first
        skill_a = a.get("skill_score", 0)
        skill_b = b.get("skill_score", 0)
        if skill_a != skill_b:
            return -1 if skill_a > skill_b else 1

        # 2. Higher experience score first
        exp_a = a.get("experience_score", 0)
        exp_b = b.get("experience_score", 0)
        if exp_a != exp_b:
            return -1 if exp_a > exp_b else 1

        # 3. Higher project score first
        proj_a = a.get("project_score", 0)
        proj_b = b.get("project_score", 0)
        if proj_a != proj_b:
            return -1 if proj_a > proj_b else 1

        # All tiebreakers equal, maintain order (stable sort)
        return 0

    def get_visualization_data(self):
        """Return sorting steps for visualization."""
        return {
            "steps": self.steps,
            "comparisons": self.comparisons,
            "swaps": self.swaps,
            "algorithm": "Merge Sort",
            "time_complexity": {
                "best": "O(n log n)",
                "average": "O(n log n)",
                "worst": "O(n log n)"
            },
            "space_complexity": "O(n)"
        }
