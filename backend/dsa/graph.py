"""
Custom Graph Implementation
=============================
Purpose: Represent relationships between candidates and skills as a bipartite graph.
Adjacency list representation.

Time Complexity:
  - Add Node: O(1)
  - Add Edge: O(1)
  - Remove Edge: O(degree)
  - Get Neighbors: O(1) lookup + O(degree) to list
  - BFS: O(V + E)
  - DFS: O(V + E)

Space Complexity: O(V + E)
"""

from collections import deque


class Graph:
    """
    Custom Graph implementation using adjacency lists.
    Represents a bipartite graph of Candidates <-> Skills.
    """

    def __init__(self):
        self.adjacency_list = {}  # node_id -> set of neighbor_ids
        self.node_types = {}  # node_id -> "candidate" or "skill"
        self.node_labels = {}  # node_id -> display label
        self.operations_log = []

    def add_node(self, node_id, node_type="candidate", label=None):
        """Add a node to the graph."""
        str_id = str(node_id)
        if str_id not in self.adjacency_list:
            self.adjacency_list[str_id] = set()
            self.node_types[str_id] = node_type
            self.node_labels[str_id] = label or str_id
            self.operations_log.append({
                "operation": "add_node",
                "node_id": str_id,
                "node_type": node_type,
                "label": label
            })
            return True
        return False

    def remove_node(self, node_id):
        """Remove a node and all its edges."""
        str_id = str(node_id)
        if str_id in self.adjacency_list:
            # Remove all edges to this node
            neighbors = list(self.adjacency_list[str_id])
            for neighbor in neighbors:
                self.adjacency_list[neighbor].discard(str_id)
            del self.adjacency_list[str_id]
            del self.node_types[str_id]
            del self.node_labels[str_id]
            self.operations_log.append({
                "operation": "remove_node",
                "node_id": str_id
            })
            return True
        return False

    def add_edge(self, node1_id, node2_id):
        """Add an undirected edge between two nodes."""
        str_id1 = str(node1_id)
        str_id2 = str(node2_id)

        if str_id1 not in self.adjacency_list or str_id2 not in self.adjacency_list:
            return False

        self.adjacency_list[str_id1].add(str_id2)
        self.adjacency_list[str_id2].add(str_id1)

        self.operations_log.append({
            "operation": "add_edge",
            "node1": str_id1,
            "node2": str_id2
        })
        return True

    def remove_edge(self, node1_id, node2_id):
        """Remove an edge between two nodes."""
        str_id1 = str(node1_id)
        str_id2 = str(node2_id)

        if str_id1 in self.adjacency_list and str_id2 in self.adjacency_list:
            self.adjacency_list[str_id1].discard(str_id2)
            self.adjacency_list[str_id2].discard(str_id1)
            self.operations_log.append({
                "operation": "remove_edge",
                "node1": str_id1,
                "node2": str_id2
            })
            return True
        return False

    def has_edge(self, node1_id, node2_id):
        """Check if an edge exists between two nodes."""
        str_id1 = str(node1_id)
        str_id2 = str(node2_id)
        if str_id1 in self.adjacency_list:
            return str_id2 in self.adjacency_list[str_id1]
        return False

    def get_neighbors(self, node_id):
        """Get all neighbors of a node."""
        str_id = str(node_id)
        if str_id in self.adjacency_list:
            return [
                {
                    "id": n,
                    "type": self.node_types.get(n),
                    "label": self.node_labels.get(n)
                }
                for n in self.adjacency_list[str_id]
            ]
        return []

    def get_candidates_with_skill(self, skill_id):
        """Get all candidate nodes connected to a skill node."""
        neighbors = self.get_neighbors(skill_id)
        return [n for n in neighbors if n["type"] == "candidate"]

    def get_skills_of_candidate(self, candidate_id):
        """Get all skill nodes connected to a candidate node."""
        neighbors = self.get_neighbors(candidate_id)
        return [n for n in neighbors if n["type"] == "skill"]

    def bfs(self, start_id):
        """Breadth-First Search from a starting node."""
        str_id = str(start_id)
        if str_id not in self.adjacency_list:
            return []

        visited = set()
        queue = deque([str_id])
        visited.add(str_id)
        result = []

        while queue:
            current = queue.popleft()
            result.append({
                "id": current,
                "type": self.node_types.get(current),
                "label": self.node_labels.get(current)
            })
            for neighbor in sorted(self.adjacency_list[current]):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)

        return result

    def dfs(self, start_id):
        """Depth-First Search from a starting node."""
        str_id = str(start_id)
        if str_id not in self.adjacency_list:
            return []

        visited = set()
        result = []
        self._dfs_helper(str_id, visited, result)
        return result

    def _dfs_helper(self, node_id, visited, result):
        """Recursive DFS helper."""
        visited.add(node_id)
        result.append({
            "id": node_id,
            "type": self.node_types.get(node_id),
            "label": self.node_labels.get(node_id)
        })
        for neighbor in sorted(self.adjacency_list[node_id]):
            if neighbor not in visited:
                self._dfs_helper(neighbor, visited, result)

    def get_common_skills(self, candidate1_id, candidate2_id):
        """Find skills common to two candidates."""
        skills1 = set(n["id"] for n in self.get_skills_of_candidate(candidate1_id))
        skills2 = set(n["id"] for n in self.get_skills_of_candidate(candidate2_id))
        common = skills1.intersection(skills2)
        return [
            {"id": s, "label": self.node_labels.get(s)}
            for s in common
        ]

    def get_visualization_data(self):
        """Return data for visual representation of the graph."""
        nodes = []
        edges = []
        seen_edges = set()

        for node_id in self.adjacency_list:
            nodes.append({
                "id": node_id,
                "type": self.node_types.get(node_id, "unknown"),
                "label": self.node_labels.get(node_id, node_id),
                "degree": len(self.adjacency_list[node_id])
            })

            for neighbor_id in self.adjacency_list[node_id]:
                edge_key = tuple(sorted([node_id, neighbor_id]))
                if edge_key not in seen_edges:
                    seen_edges.add(edge_key)
                    edges.append({
                        "source": node_id,
                        "target": neighbor_id
                    })

        return {
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges),
            "operations_log": self.operations_log[-20:]
        }

    def get_stats(self):
        """Return statistics about the graph."""
        candidate_count = sum(1 for t in self.node_types.values() if t == "candidate")
        skill_count = sum(1 for t in self.node_types.values() if t == "skill")
        edge_count = sum(len(neighbors) for neighbors in self.adjacency_list.values()) // 2

        degrees = [len(neighbors) for neighbors in self.adjacency_list.values()]
        avg_degree = sum(degrees) / len(degrees) if degrees else 0

        return {
            "total_nodes": len(self.adjacency_list),
            "candidate_nodes": candidate_count,
            "skill_nodes": skill_count,
            "edge_count": edge_count,
            "average_degree": round(avg_degree, 2)
        }
