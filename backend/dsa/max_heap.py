"""
Custom Max Heap Implementation
================================
Purpose: Efficiently retrieve Top-K highest-scoring candidates.
Array-based binary max heap.

Time Complexity:
  - Insert: O(log n)
  - Peek (get max): O(1)
  - Extract Max: O(log n)
  - Heapify: O(n)
  - Top-K: O(n + k log n)

Space Complexity: O(n)
"""


class MaxHeap:
    """
    Custom Max Heap implementation using an array.
    Used for efficiently retrieving Top-K candidates by score.
    """

    def __init__(self):
        self.heap = []  # Array-based heap
        self.operations_log = []

    def _parent(self, index):
        """Get parent index."""
        return (index - 1) // 2

    def _left_child(self, index):
        """Get left child index."""
        return 2 * index + 1

    def _right_child(self, index):
        """Get right child index."""
        return 2 * index + 2

    def _swap(self, i, j):
        """Swap two elements."""
        self.heap[i], self.heap[j] = self.heap[j], self.heap[i]

    def _get_score(self, index):
        """Get the score value from a heap element."""
        if isinstance(self.heap[index], dict):
            return self.heap[index].get("final_score", self.heap[index].get("score", 0))
        return self.heap[index]

    def _sift_up(self, index):
        """Move an element up to maintain heap property."""
        steps = []
        while index > 0:
            parent = self._parent(index)
            if self._get_score(index) > self._get_score(parent):
                steps.append({"swap": [index, parent]})
                self._swap(index, parent)
                index = parent
            else:
                break
        return steps

    def _sift_down(self, index):
        """Move an element down to maintain heap property."""
        size = len(self.heap)
        steps = []

        while True:
            largest = index
            left = self._left_child(index)
            right = self._right_child(index)

            if left < size and self._get_score(left) > self._get_score(largest):
                largest = left
            if right < size and self._get_score(right) > self._get_score(largest):
                largest = right

            if largest != index:
                steps.append({"swap": [index, largest]})
                self._swap(index, largest)
                index = largest
            else:
                break
        return steps

    def insert(self, element):
        """Insert an element into the heap."""
        self.heap.append(element)
        steps = self._sift_up(len(self.heap) - 1)

        self.operations_log.append({
            "operation": "insert",
            "element": self._element_summary(element),
            "steps": steps,
            "heap_size": len(self.heap)
        })

    def peek(self):
        """Return the maximum element without removing it."""
        if not self.heap:
            return None
        self.operations_log.append({
            "operation": "peek",
            "result": self._element_summary(self.heap[0])
        })
        return self.heap[0]

    def extract_max(self):
        """Remove and return the maximum element."""
        if not self.heap:
            return None

        if len(self.heap) == 1:
            element = self.heap.pop()
            self.operations_log.append({
                "operation": "extract_max",
                "result": self._element_summary(element),
                "heap_size": 0
            })
            return element

        max_element = self.heap[0]
        self.heap[0] = self.heap.pop()  # Move last element to root
        steps = self._sift_down(0)

        self.operations_log.append({
            "operation": "extract_max",
            "result": self._element_summary(max_element),
            "steps": steps,
            "heap_size": len(self.heap)
        })

        return max_element

    def build_heap(self, elements):
        """Build a heap from a list of elements (heapify). O(n)"""
        self.heap = list(elements)
        # Start from last non-leaf node
        for i in range(len(self.heap) // 2 - 1, -1, -1):
            self._sift_down(i)

        self.operations_log.append({
            "operation": "build_heap",
            "size": len(self.heap)
        })

    def top_k(self, k):
        """
        Extract the top K elements from the heap.
        Returns a list of the K largest elements.
        """
        # Create a copy of the heap to avoid modifying the original
        original_heap = list(self.heap)
        results = []

        for _ in range(min(k, len(self.heap))):
            max_el = self.extract_max()
            if max_el is not None:
                results.append(max_el)

        # Restore the heap
        self.heap = original_heap

        self.operations_log.append({
            "operation": "top_k",
            "k": k,
            "results_count": len(results)
        })

        return results

    def size(self):
        """Return the number of elements in the heap."""
        return len(self.heap)

    def is_empty(self):
        """Check if the heap is empty."""
        return len(self.heap) == 0

    def _element_summary(self, element):
        """Create a summary of an element for logging."""
        if isinstance(element, dict):
            return {
                "name": element.get("name", "Unknown"),
                "score": element.get("final_score", element.get("score", 0))
            }
        return {"value": element}

    def get_visualization_data(self):
        """Return heap structure for visualization."""
        nodes = []
        for i, element in enumerate(self.heap):
            node = {
                "index": i,
                "level": 0,
                "parent": None,
                "left_child": None,
                "right_child": None
            }

            if isinstance(element, dict):
                node["name"] = element.get("name", f"Node {i}")
                node["score"] = element.get("final_score", element.get("score", 0))
                node["candidate_id"] = element.get("id", element.get("candidate_id"))
            else:
                node["name"] = f"Node {i}"
                node["score"] = element

            # Calculate level
            import math
            if i > 0:
                node["level"] = int(math.log2(i + 1))
            node["parent"] = self._parent(i) if i > 0 else None

            left = self._left_child(i)
            right = self._right_child(i)
            node["left_child"] = left if left < len(self.heap) else None
            node["right_child"] = right if right < len(self.heap) else None

            nodes.append(node)

        return {
            "nodes": nodes,
            "size": len(self.heap),
            "max_element": self._element_summary(self.heap[0]) if self.heap else None,
            "operations_log": self.operations_log[-20:]
        }

    def get_stats(self):
        """Return statistics about the heap."""
        import math
        height = int(math.log2(len(self.heap))) + 1 if self.heap else 0
        return {
            "size": len(self.heap),
            "height": height,
            "max_element": self._element_summary(self.heap[0]) if self.heap else None
        }

    def validate(self):
        """Check if the heap property is maintained."""
        for i in range(len(self.heap)):
            left = self._left_child(i)
            right = self._right_child(i)
            if left < len(self.heap) and self._get_score(left) > self._get_score(i):
                return False
            if right < len(self.heap) and self._get_score(right) > self._get_score(i):
                return False
        return True
