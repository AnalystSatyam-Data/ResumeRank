"""
Custom Hash Table Implementation
=================================
Purpose: Quick lookup of candidates by skill name.
Uses chaining (linked list per bucket) for collision resolution.

Time Complexity:
  - Average Insert: O(1)
  - Average Search: O(1)
  - Average Delete: O(1)
  - Worst case (all collisions): O(n)

Space Complexity: O(n + m) where n = entries, m = table size
"""


class HashNode:
    """A node in the chain (linked list) for collision handling."""

    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.next = None

    def to_dict(self):
        return {"key": self.key, "value": self.value}


class HashTable:
    """
    Custom Hash Table using chaining for collision resolution.
    Used for indexing skills to candidate IDs.
    """

    def __init__(self, size=53):
        self.size = size
        self.table = [None] * self.size
        self.count = 0
        self.operations_log = []

    def _hash(self, key):
        """
        Custom hash function using polynomial rolling hash.
        Uses prime number 31 as the base for better distribution.
        """
        key = str(key).lower().strip()
        hash_value = 0
        prime = 31
        for i, char in enumerate(key):
            hash_value = (hash_value * prime + ord(char)) % self.size
        return hash_value

    def insert(self, key, value):
        """
        Insert a key-value pair. If key exists, append value to list.
        For skill indexing: key=skill_name, value=candidate_id
        """
        index = self._hash(key)
        normalized_key = str(key).lower().strip()

        node = self.table[index]
        while node:
            if node.key == normalized_key:
                # Key exists - append value if not already present
                if isinstance(node.value, list):
                    if value not in node.value:
                        node.value.append(value)
                else:
                    if node.value != value:
                        node.value = [node.value, value]
                self.operations_log.append({
                    "operation": "insert",
                    "key": normalized_key,
                    "value": value,
                    "index": index,
                    "collision": True
                })
                return index
            node = node.next

        # Key doesn't exist - create new node
        new_node = HashNode(normalized_key, [value] if not isinstance(value, list) else value)
        new_node.next = self.table[index]
        collision = self.table[index] is not None
        self.table[index] = new_node
        self.count += 1

        self.operations_log.append({
            "operation": "insert",
            "key": normalized_key,
            "value": value,
            "index": index,
            "collision": collision
        })

        # Resize if load factor > 0.75
        if self.count / self.size > 0.75:
            self._resize()

        return index

    def search(self, key):
        """Search for a key and return its value (list of candidate IDs)."""
        index = self._hash(key)
        normalized_key = str(key).lower().strip()

        node = self.table[index]
        steps = 0
        while node:
            steps += 1
            if node.key == normalized_key:
                self.operations_log.append({
                    "operation": "search",
                    "key": normalized_key,
                    "found": True,
                    "index": index,
                    "steps": steps
                })
                return node.value
            node = node.next

        self.operations_log.append({
            "operation": "search",
            "key": normalized_key,
            "found": False,
            "index": index,
            "steps": steps
        })
        return None

    def contains(self, key):
        """Check if a key exists in the hash table."""
        return self.search(key) is not None


    def delete(self, key, value=None):
        """
        Delete a key or a specific value from the key's list.
        If value is None, delete entire key.
        If value is given, remove that value from the list.
        """
        index = self._hash(key)
        normalized_key = str(key).lower().strip()

        prev = None
        node = self.table[index]
        while node:
            if node.key == normalized_key:
                if value is not None and isinstance(node.value, list):
                    # Remove specific value
                    if value in node.value:
                        node.value.remove(value)
                    if not node.value:
                        # List empty, remove node
                        if prev:
                            prev.next = node.next
                        else:
                            self.table[index] = node.next
                        self.count -= 1
                else:
                    # Remove entire node
                    if prev:
                        prev.next = node.next
                    else:
                        self.table[index] = node.next
                    self.count -= 1

                self.operations_log.append({
                    "operation": "delete",
                    "key": normalized_key,
                    "index": index,
                    "success": True
                })
                return True
            prev = node
            node = node.next

        self.operations_log.append({
            "operation": "delete",
            "key": normalized_key,
            "index": index,
            "success": False
        })
        return False

    def _resize(self):
        """Double the table size and rehash all entries."""
        old_table = self.table
        self.size = self.size * 2 + 1  # Next odd number
        self.table = [None] * self.size
        self.count = 0

        for node in old_table:
            while node:
                self.insert(node.key, node.value)
                node = node.next

    def get_all_entries(self):
        """Return all key-value pairs in the hash table."""
        entries = []
        for i, node in enumerate(self.table):
            chain = []
            current = node
            while current:
                chain.append(current.to_dict())
                current = current.next
            if chain:
                entries.append({"index": i, "chain": chain})
        return entries

    def get_visualization_data(self):
        """Return data for visual representation of the hash table."""
        buckets = []
        for i in range(self.size):
            chain = []
            node = self.table[i]
            while node:
                chain.append({"key": node.key, "value": node.value})
                node = node.next
            buckets.append({"index": i, "chain": chain, "has_data": len(chain) > 0})
        return {
            "buckets": buckets,
            "size": self.size,
            "count": self.count,
            "load_factor": round(self.count / self.size, 3) if self.size > 0 else 0,
            "operations_log": self.operations_log[-20:]  # Last 20 operations
        }

    def get_stats(self):
        """Return statistics about the hash table."""
        non_empty = sum(1 for node in self.table if node is not None)
        max_chain = 0
        total_chain = 0
        for node in self.table:
            length = 0
            current = node
            while current:
                length += 1
                current = current.next
            max_chain = max(max_chain, length)
            total_chain += length
        return {
            "size": self.size,
            "count": self.count,
            "non_empty_buckets": non_empty,
            "load_factor": round(self.count / self.size, 3) if self.size > 0 else 0,
            "max_chain_length": max_chain,
            "avg_chain_length": round(total_chain / non_empty, 2) if non_empty > 0 else 0
        }
