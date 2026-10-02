"""
Unit Tests for Custom Data Structures and Algorithms (DSA)
===========================================================
Tests for:
1. Hash Table (Separate Chaining)
2. Trie (Prefix Tree)
3. Graph (Adjacency List, BFS, DFS)
4. Merge Sort (Divide and Conquer)
5. Max Heap / Priority Queue
"""
import pytest
from backend.dsa.hash_table import HashTable
from backend.dsa.trie import Trie
from backend.dsa.graph import Graph
from backend.dsa.merge_sort import MergeSort
from backend.dsa.max_heap import MaxHeap


class TestHashTable:
    def test_insert_and_search(self):
        ht = HashTable(size=11)
        ht.insert("Python", 1)
        ht.insert("Python", 2)
        ht.insert("Java", 3)

        assert 1 in ht.search("Python")
        assert 2 in ht.search("Python")
        assert 3 in ht.search("Java")
        assert ht.search("NonExistent") is None

    def test_contains(self):
        ht = HashTable(size=11)
        ht.insert("React", 101)
        assert ht.contains("React") is True
        assert ht.contains("Vue") is False

    def test_delete(self):
        ht = HashTable(size=11)
        ht.insert("Docker", 5)
        ht.insert("Docker", 6)
        ht.delete("Docker", 5)
        assert ht.search("Docker") == [6]


class TestTrie:
    def test_insert_and_search(self):
        trie = Trie()
        trie.insert("python")
        trie.insert("pytorch")
        trie.insert("pyspark")

        assert trie.search("python") is True
        assert trie.search("py") is False

    def test_starts_with(self):
        trie = Trie()
        trie.insert("javascript")
        assert trie.starts_with("java") is True
        assert trie.starts_with("type") is False

    def test_autocomplete(self):
        trie = Trie()
        for skill in ["python", "pytorch", "pyspark", "java", "javascript"]:
            trie.insert(skill)

        results = trie.autocomplete("py")
        words = {r["word"] for r in results}
        assert words == {"python", "pytorch", "pyspark"}


class TestGraph:
    def test_nodes_and_edges(self):
        g = Graph()
        g.add_node("cand_1", "candidate", "Alice")
        g.add_node("skill_1", "skill", "Python")
        g.add_edge("cand_1", "skill_1")

        assert "cand_1" in g.adjacency_list
        assert "skill_1" in g.adjacency_list
        neighbor_ids = [n["id"] for n in g.get_neighbors("cand_1")]
        assert "skill_1" in neighbor_ids

    def test_bfs_traversal(self):
        g = Graph()
        g.add_node("A", "test", "A")
        g.add_node("B", "test", "B")
        g.add_node("C", "test", "C")
        g.add_edge("A", "B")
        g.add_edge("B", "C")

        order = [n["id"] for n in g.bfs("A")]
        assert order == ["A", "B", "C"]


class TestMergeSort:
    def test_sorting_order(self):
        candidates = [
            {"name": "Alice", "final_score": 85},
            {"name": "Bob", "final_score": 95},
            {"name": "Charlie", "final_score": 70},
            {"name": "David", "final_score": 90},
        ]
        ms = MergeSort()
        sorted_cands = ms.sort(candidates, key="final_score", reverse=True)
        scores = [c["final_score"] for c in sorted_cands]
        assert scores == [95, 90, 85, 70]

    def test_visualization_steps(self):
        candidates = [
            {"name": "A", "final_score": 50},
            {"name": "B", "final_score": 80},
            {"name": "C", "final_score": 60},
        ]
        ms = MergeSort()
        sorted_res = ms.sort(candidates, key="final_score", reverse=True, record_steps=True)
        assert len(ms.steps) > 0
        assert [c["final_score"] for c in sorted_res] == [80, 60, 50]


class TestMaxHeap:
    def test_push_and_extract_max(self):
        heap = MaxHeap()
        heap.insert({"id": 1, "name": "Alice", "score": 75})
        heap.insert({"id": 2, "name": "Bob", "score": 95})
        heap.insert({"id": 3, "name": "Charlie", "score": 85})

        top = heap.extract_max()
        assert top["name"] == "Bob"
        assert top["score"] == 95

        next_top = heap.extract_max()
        assert next_top["name"] == "Charlie"

    def test_top_k(self):
        heap = MaxHeap()
        items = [
            {"name": "A", "score": 50},
            {"name": "B", "score": 90},
            {"name": "C", "score": 80},
            {"name": "D", "score": 70},
        ]
        for item in items:
            heap.insert(item)

        top2 = heap.top_k(2)
        assert len(top2) == 2
        assert top2[0]["score"] == 90
        assert top2[1]["score"] == 80
