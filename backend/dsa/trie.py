"""
Custom Trie Implementation
===========================
Purpose: Autocomplete and prefix-based skill search.
Allows fast prefix matching for skill names.

Time Complexity:
  - Insert: O(L) where L is length of the word
  - Search: O(L)
  - Prefix Search: O(L + K) where K is number of results
  - Autocomplete: O(L + K)

Space Complexity: O(N * L) where N is number of words, L is average length
"""


class TrieNode:
    """A node in the Trie."""

    def __init__(self):
        self.children = {}
        self.is_end = False
        self.word = None  # Store the complete word at end nodes
        self.data = None  # Optional associated data

    def to_dict(self):
        """Convert node to dictionary for visualization."""
        children_dict = {}
        for char, child in self.children.items():
            children_dict[char] = child.to_dict()
        return {
            "children": children_dict,
            "is_end": self.is_end,
            "word": self.word,
            "char_count": len(self.children)
        }


class Trie:
    """
    Custom Trie (Prefix Tree) implementation.
    Used for skill name autocomplete and prefix search.
    """

    def __init__(self):
        self.root = TrieNode()
        self.word_count = 0
        self.operations_log = []

    def insert(self, word, data=None):
        """Insert a word into the Trie."""
        if not word:
            return

        normalized = word.lower().strip()
        node = self.root
        for char in normalized:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]

        if not node.is_end:
            self.word_count += 1
        node.is_end = True
        node.word = word  # Store original casing
        node.data = data

        self.operations_log.append({
            "operation": "insert",
            "word": word,
            "length": len(normalized)
        })

    def search(self, word):
        """Search for an exact word in the Trie."""
        if not word:
            return False

        normalized = word.lower().strip()
        node = self.root
        steps = 0
        for char in normalized:
            steps += 1
            if char not in node.children:
                self.operations_log.append({
                    "operation": "search",
                    "word": word,
                    "found": False,
                    "steps": steps
                })
                return False
            node = node.children[char]

        found = node.is_end
        self.operations_log.append({
            "operation": "search",
            "word": word,
            "found": found,
            "steps": steps
        })
        return found

    def starts_with(self, prefix):
        """Check if any word starts with the given prefix."""
        if not prefix:
            return True

        normalized = prefix.lower().strip()
        node = self.root
        for char in normalized:
            if char not in node.children:
                return False
            node = node.children[char]
        return True

    def autocomplete(self, prefix, max_results=10):
        """
        Return all words that start with the given prefix.
        Limited to max_results for performance.
        """
        if not prefix:
            return self._get_all_words(max_results)

        normalized = prefix.lower().strip()
        node = self.root
        steps = 0

        # Navigate to the prefix node
        for char in normalized:
            steps += 1
            if char not in node.children:
                self.operations_log.append({
                    "operation": "autocomplete",
                    "prefix": prefix,
                    "results": 0,
                    "steps": steps
                })
                return []
            node = node.children[char]

        # Collect all words from this node
        results = []
        self._collect_words(node, results, max_results)

        self.operations_log.append({
            "operation": "autocomplete",
            "prefix": prefix,
            "results": len(results),
            "steps": steps
        })

        return results

    def _collect_words(self, node, results, max_results):
        """Recursively collect all words from a node."""
        if len(results) >= max_results:
            return

        if node.is_end:
            results.append({
                "word": node.word,
                "data": node.data
            })

        # Sort children for consistent ordering
        for char in sorted(node.children.keys()):
            if len(results) >= max_results:
                return
            self._collect_words(node.children[char], results, max_results)

    def _get_all_words(self, max_results=50):
        """Get all words in the Trie."""
        results = []
        self._collect_words(self.root, results, max_results)
        return results

    def delete(self, word):
        """Delete a word from the Trie."""
        if not word:
            return False

        normalized = word.lower().strip()
        result = self._delete_helper(self.root, normalized, 0)
        if result:
            self.word_count -= 1
            self.operations_log.append({
                "operation": "delete",
                "word": word,
                "success": True
            })
        return result

    def _delete_helper(self, node, word, depth):
        """Recursive helper for delete."""
        if depth == len(word):
            if not node.is_end:
                return False
            node.is_end = False
            node.word = None
            node.data = None
            return len(node.children) == 0

        char = word[depth]
        if char not in node.children:
            return False

        should_delete = self._delete_helper(node.children[char], word, depth + 1)

        if should_delete:
            del node.children[char]
            return not node.is_end and len(node.children) == 0

        return False

    def get_visualization_data(self, prefix=""):
        """Return tree structure for visualization."""
        if prefix:
            normalized = prefix.lower().strip()
            node = self.root
            for char in normalized:
                if char not in node.children:
                    return {"tree": None, "word_count": 0, "prefix": prefix}
                node = node.children[char]
            return {
                "tree": self._build_viz_tree(node, prefix),
                "word_count": self.word_count,
                "prefix": prefix,
                "operations_log": self.operations_log[-20:]
            }

        return {
            "tree": self._build_viz_tree(self.root, ""),
            "word_count": self.word_count,
            "prefix": "",
            "operations_log": self.operations_log[-20:]
        }

    def _build_viz_tree(self, node, current_prefix, max_depth=8):
        """Build a visualization tree structure."""
        if max_depth <= 0:
            return None

        children = []
        for char in sorted(node.children.keys()):
            child = node.children[char]
            child_data = {
                "char": char,
                "is_end": child.is_end,
                "word": child.word,
                "prefix": current_prefix + char,
                "children": []
            }
            child_tree = self._build_viz_tree(child, current_prefix + char, max_depth - 1)
            if child_tree and child_tree.get("children"):
                child_data["children"] = child_tree["children"]
            children.append(child_data)

        return {
            "char": current_prefix[-1] if current_prefix else "root",
            "is_end": node.is_end,
            "word": node.word,
            "prefix": current_prefix,
            "children": children
        }

    def get_stats(self):
        """Return statistics about the Trie."""
        node_count = self._count_nodes(self.root)
        return {
            "word_count": self.word_count,
            "node_count": node_count,
            "operations": len(self.operations_log)
        }

    def _count_nodes(self, node):
        """Count total nodes in the Trie."""
        count = 1
        for child in node.children.values():
            count += self._count_nodes(child)
        return count
