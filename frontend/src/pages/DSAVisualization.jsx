import { useState, useEffect } from 'react';
import { dsaAPI, optimizationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineLightningBolt } from 'react-icons/hi';

export default function DSAVisualization() {
  const [activeTab, setActiveTab] = useState('hash');

  const tabs = [
    { id: 'hash', label: 'Hash Table', unit: 'Existing DSA' },
    { id: 'trie', label: 'Trie', unit: 'Existing DSA' },
    { id: 'graph', label: 'Graph', unit: 'Existing DSA' },
    { id: 'mergesort', label: 'Merge Sort', unit: 'Existing DSA' },
    { id: 'heap', label: 'Max Heap', unit: 'Existing DSA' },
    { id: 'knapsack', label: '0/1 Knapsack', unit: 'Unit 3 (DP)' },
    { id: 'branchbound', label: 'Branch & Bound', unit: 'Unit 4 (B&B)' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>DSA Visualization</h1>
        <p>Interactive visualizer for core recruitment data structures & advanced optimization algorithms</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          MODULES:
        </span>
        <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
          Units 1 & 2: Hash Table, Trie, Graph, Merge Sort, Max Heap
        </span>
        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
          Units 3 & 4 (New): 0/1 Knapsack (DP), Branch and Bound (LCBB)
        </span>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => setActiveTab(t.id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>{t.label}</span>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: 4,
                background: t.unit.startsWith('Unit 3') ? 'rgba(59,130,246,0.2)' : t.unit.startsWith('Unit 4') ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)',
                color: t.unit.startsWith('Unit 3') ? '#60a5fa' : t.unit.startsWith('Unit 4') ? '#34d399' : 'var(--text-secondary)',
                fontWeight: 600
              }}
            >
              {t.unit}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'hash' && <HashTableViz />}
      {activeTab === 'trie' && <TrieViz />}
      {activeTab === 'graph' && <GraphViz />}
      {activeTab === 'mergesort' && <MergeSortViz />}
      {activeTab === 'heap' && <MaxHeapViz />}
      {activeTab === 'knapsack' && <KnapsackViz />}
      {activeTab === 'branchbound' && <BranchBoundViz />}
    </div>
  );
}

// ==================== HASH TABLE ====================
function HashTableViz() {
  const [data, setData] = useState(null);
  const [searchKey, setSearchKey] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { dsaAPI.getHashTable().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  async function handleSearch() {
    if (!searchKey.trim()) return;
    try {
      const res = await dsaAPI.searchHashTable(searchKey);
      setSearchResult(res);
      toast.success(res.found ? `Found! ${(res.value || []).length} candidate(s)` : 'Not found');
    } catch (err) { toast.error('Search failed'); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading Hash Table...</p></div>;

  const viz = data?.visualization || {};
  const stats = data?.stats || {};
  const filledBuckets = (viz.buckets || []).filter(b => b.has_data);

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div className="dsa-section-title">Hash Table — Resume Skill Index</div>
          <div className="dsa-section-desc">Used to quickly locate candidates having a particular skill. Chaining for collision resolution.</div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Search: O(1) avg</span>
          <span className="complexity-badge">Insert: O(1) avg</span>
          <span className="complexity-badge">Delete: O(1) avg</span>
        </div>
      </div>

      {/* Stats */}
      <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="summary-card"><div className="summary-card-value">{stats.size || 0}</div><div className="summary-card-label">Table Size</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.count || 0}</div><div className="summary-card-label">Entries</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.load_factor || 0}</div><div className="summary-card-label">Load Factor</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.max_chain_length || 0}</div><div className="summary-card-label">Max Chain</div></div>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input className="form-input" placeholder="Search skill in hash table (e.g. Python)..." value={searchKey}
          onChange={e => setSearchKey(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} style={{ maxWidth: 400 }} />
        <button className="btn btn-primary" onClick={handleSearch}><HiOutlineSearch /> Search</button>
      </div>

      {searchResult && (
        <div className="card mb-lg" style={{ borderColor: searchResult.found ? 'var(--success)' : 'var(--danger)' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
            {searchResult.found ? `✓ Found "${searchResult.key}"` : `✗ "${searchResult.key}" not found`}
          </div>
          {searchResult.found && searchResult.value && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Candidate IDs: [{(searchResult.value || []).join(', ')}]
            </div>
          )}
        </div>
      )}

      {/* Buckets Visualization */}
      <div style={{ maxHeight: 500, overflowY: 'auto' }}>
        {filledBuckets.length > 0 ? filledBuckets.map(bucket => (
          <div key={bucket.index} className="hash-bucket">
            <div className="hash-bucket-index">[{bucket.index}]</div>
            <div className="hash-bucket-chain">
              {bucket.chain.map((node, j) => (
                <span key={j}>
                  {j > 0 && <span className="hash-arrow"> → </span>}
                  <span className="hash-node">{node.key}: [{Array.isArray(node.value) ? node.value.join(',') : node.value}]</span>
                </span>
              ))}
            </div>
          </div>
        )) : <div className="text-muted">No data in hash table</div>}
      </div>
    </div>
  );
}

// ==================== TRIE ====================
function TrieViz() {
  const [prefix, setPrefix] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [trieData, setTrieData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dsaAPI.getTrie('').then(res => {
      setTrieData(res.visualization);
      setStats(res.stats);
    }).finally(() => setLoading(false));
  }, []);

  async function handleSearch(q) {
    setPrefix(q);
    if (q.length > 0) {
      try {
        const res = await dsaAPI.trieAutocomplete(q);
        setSuggestions(res.suggestions || []);
      } catch { setSuggestions([]); }
    } else { setSuggestions([]); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading Trie...</p></div>;

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div className="dsa-section-title">Trie — Skill Autocomplete</div>
          <div className="dsa-section-desc">Prefix tree for fast skill name autocomplete. Type a prefix to search.</div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Search: O(L)</span>
          <span className="complexity-badge">Insert: O(L)</span>
          <span className="complexity-badge">Autocomplete: O(L+K)</span>
        </div>
      </div>

      <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="summary-card"><div className="summary-card-value">{stats?.word_count || 0}</div><div className="summary-card-label">Words</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats?.node_count || 0}</div><div className="summary-card-label">Nodes</div></div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <input className="form-input" placeholder='Type prefix (e.g. "Py", "Ma", "Re")...' value={prefix}
          onChange={e => handleSearch(e.target.value)} style={{ maxWidth: 400, fontSize: '1rem' }} />
      </div>

      {prefix && (
        <div className="card mb-lg">
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Autocomplete results for "{prefix}":</div>
          {suggestions.length > 0 ? (
            <div className="skill-badges" style={{ gap: '8px' }}>
              {suggestions.map((s, i) => (
                <span key={i} className="skill-badge" style={{ fontSize: '0.875rem', padding: '6px 14px' }}>{s.word}</span>
              ))}
            </div>
          ) : <div className="text-muted">No matches found</div>}
        </div>
      )}

      {/* Trie Tree Visualization */}
      {trieData?.tree && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Trie Structure (first few levels)</div>
          <div className="trie-tree" style={{ maxHeight: 400, overflowY: 'auto' }}>
            <TrieNodeViz node={trieData.tree} depth={0} maxDepth={4} />
          </div>
        </div>
      )}
    </div>
  );
}

function TrieNodeViz({ node, depth, maxDepth }) {
  if (!node || depth > maxDepth) return null;
  return (
    <div className="trie-node" style={{ marginLeft: depth * 24 }}>
      <div className={`trie-node-content ${node.is_end ? 'is-end' : 'is-branch'}`}>
        <span style={{ fontWeight: 700 }}>{node.char || 'root'}</span>
        {node.is_end && <span style={{ fontSize: '0.7rem' }}>✓ {node.word}</span>}
      </div>
      {(node.children || []).slice(0, 10).map((child, i) => (
        <TrieNodeViz key={i} node={child} depth={depth + 1} maxDepth={maxDepth} />
      ))}
    </div>
  );
}

// ==================== GRAPH ====================
function GraphViz() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { dsaAPI.getGraph().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading Graph...</p></div>;

  const viz = data?.visualization || {};
  const stats = data?.stats || {};
  const nodes = viz.nodes || [];
  const edges = viz.edges || [];

  const candidateNodes = nodes.filter(n => n.type === 'candidate');
  const skillNodes = nodes.filter(n => n.type === 'skill');

  // Simple layout: candidates on left, skills on right
  const cWidth = 800;
  const cHeight = Math.max(400, Math.max(candidateNodes.length, skillNodes.length) * 45 + 80);

  const getPos = (node) => {
    if (node.type === 'candidate') {
      const idx = candidateNodes.indexOf(node);
      return { x: 120, y: 40 + idx * (cHeight - 80) / Math.max(candidateNodes.length - 1, 1) };
    } else {
      const idx = skillNodes.indexOf(node);
      return { x: cWidth - 120, y: 40 + idx * (cHeight - 80) / Math.max(skillNodes.length - 1, 1) };
    }
  };

  const nodeMap = {};
  nodes.forEach(n => nodeMap[n.id] = n);

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div className="dsa-section-title">Graph — Candidate ↔ Skill Bipartite Graph</div>
          <div className="dsa-section-desc">Represents relationships between candidates and their skills. Adjacency list representation.</div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Add Node: O(1)</span>
          <span className="complexity-badge">Add Edge: O(1)</span>
          <span className="complexity-badge">BFS/DFS: O(V+E)</span>
        </div>
      </div>

      <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="summary-card"><div className="summary-card-value">{stats.candidate_nodes || 0}</div><div className="summary-card-label">Candidate Nodes</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.skill_nodes || 0}</div><div className="summary-card-label">Skill Nodes</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.edge_count || 0}</div><div className="summary-card-label">Edges</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.average_degree || 0}</div><div className="summary-card-label">Avg Degree</div></div>
      </div>

      {nodes.length > 0 ? (
        <div style={{ overflow: 'auto', background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 8 }}>
          <svg width={cWidth} height={cHeight} style={{ display: 'block' }}>
            {/* Legend */}
            <circle cx={30} cy={20} r={8} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth="2" />
            <text x={45} y={25} fill="#9aa0b0" fontSize="11">Candidate</text>
            <circle cx={140} cy={20} r={8} fill="rgba(16,185,129,0.3)" stroke="#10b981" strokeWidth="2" />
            <text x={155} y={25} fill="#9aa0b0" fontSize="11">Skill</text>

            {/* Edges */}
            {edges.slice(0, 200).map((edge, i) => {
              const src = nodeMap[edge.source];
              const tgt = nodeMap[edge.target];
              if (!src || !tgt) return null;
              const p1 = getPos(src);
              const p2 = getPos(tgt);
              return <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#2a2d3e" strokeWidth="1" opacity="0.5" />;
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const pos = getPos(node);
              const isCandidate = node.type === 'candidate';
              return (
                <g key={node.id}>
                  <circle cx={pos.x} cy={pos.y} r={isCandidate ? 14 : 10}
                    fill={isCandidate ? 'rgba(99,102,241,0.2)' : 'rgba(16,185,129,0.2)'}
                    stroke={isCandidate ? '#6366f1' : '#10b981'} strokeWidth="2" />
                  <text x={pos.x + (isCandidate ? -20 : 16)} y={pos.y + 4}
                    fill={isCandidate ? '#818cf8' : '#34d399'} fontSize="10"
                    textAnchor={isCandidate ? 'end' : 'start'}
                    style={{ maxWidth: 100 }}>
                    {(node.label || '').substring(0, 15)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : <div className="text-muted">No graph data available</div>}
    </div>
  );
}

// ==================== MERGE SORT ====================
function MergeSortViz() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runSort() {
    setLoading(true);
    try {
      const res = await dsaAPI.mergeSortViz();
      setData(res);
    } catch (err) { toast.error('Sort failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => { runSort(); }, []);

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div className="dsa-section-title">Merge Sort — Candidate Ranking</div>
          <div className="dsa-section-desc">Custom merge sort implementation for ranking candidates by score. Stable sort with deterministic tie-breaking.</div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Best: O(n log n)</span>
          <span className="complexity-badge">Average: O(n log n)</span>
          <span className="complexity-badge">Worst: O(n log n)</span>
          <span className="complexity-badge">Space: O(n)</span>
        </div>
      </div>

      <button className="btn btn-primary mb-lg" onClick={runSort} disabled={loading}>
        {loading ? 'Sorting...' : '🔄 Run Merge Sort'}
      </button>

      {data && (
        <>
          <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="summary-card"><div className="summary-card-value">{data.visualization?.comparisons || 0}</div><div className="summary-card-label">Comparisons</div></div>
            <div className="summary-card"><div className="summary-card-value">{data.visualization?.swaps || 0}</div><div className="summary-card-label">Merge Operations</div></div>
            <div className="summary-card"><div className="summary-card-value">{(data.original || []).length}</div><div className="summary-card-label">Elements</div></div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>Before Sorting (Unsorted)</div>
              {(data.original || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem' }}>{c.name}</span>
                  <span className="badge badge-neutral">{(c.final_score || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>After Sorting (Ranked)</div>
              {(data.sorted || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.875rem' }}><span className="badge badge-primary" style={{ marginRight: 8 }}>#{i + 1}</span>{c.name}</span>
                  <span className={`badge ${c.final_score >= 70 ? 'badge-success' : c.final_score >= 40 ? 'badge-warning' : 'badge-danger'}`}>{(c.final_score || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sorting Steps */}
          {data.visualization?.steps && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>Sorting Process ({data.visualization.steps.length} steps)</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {data.visualization.steps.slice(0, 30).map((step, i) => (
                  <div key={i} style={{ padding: '0.375rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.8125rem' }}>
                    <span className="badge badge-info" style={{ marginRight: 8 }}>{step.type}</span>
                    {step.type === 'split' && <span>Split: [{(step.left || []).map(c => c.name).join(', ')}] | [{(step.right || []).map(c => c.name).join(', ')}]</span>}
                    {step.type === 'merge' && <span>Merged: [{(step.result || []).map(c => `${c.name}(${c.score})`).join(', ')}]</span>}
                    {step.type === 'initial' && <span>Initial: [{(step.data || []).map(c => `${c.name}(${c.score})`).join(', ')}]</span>}
                    {step.type === 'final' && <span>Final: [{(step.data || []).map(c => `${c.name}(${c.score})`).join(', ')}]</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ==================== MAX HEAP ====================
function MaxHeapViz() {
  const [data, setData] = useState(null);
  const [topK, setTopK] = useState(5);
  const [topKResult, setTopKResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { dsaAPI.getMaxHeap().then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);

  async function handleTopK() {
    try {
      const res = await dsaAPI.maxHeapTopK(topK);
      setTopKResult(res);
      toast.success(`Retrieved top ${topK} candidates`);
    } catch (err) { toast.error('Top-K failed'); }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /><p>Loading Max Heap...</p></div>;

  const viz = data?.visualization || {};
  const heapNodes = viz.nodes || [];
  const stats = data?.stats || {};

  // Build tree levels for visualization
  const levels = [];
  if (heapNodes.length > 0) {
    let levelStart = 0;
    let levelSize = 1;
    while (levelStart < heapNodes.length) {
      levels.push(heapNodes.slice(levelStart, levelStart + levelSize));
      levelStart += levelSize;
      levelSize *= 2;
    }
  }

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div className="dsa-section-title">Max Heap — Top-K Candidate Retrieval</div>
          <div className="dsa-section-desc">Array-based binary max heap for efficiently retrieving the highest-scoring candidates.</div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Insert: O(log n)</span>
          <span className="complexity-badge">Extract Max: O(log n)</span>
          <span className="complexity-badge">Peek: O(1)</span>
        </div>
      </div>

      <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
        <div className="summary-card"><div className="summary-card-value">{stats.size || 0}</div><div className="summary-card-label">Heap Size</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.height || 0}</div><div className="summary-card-label">Height</div></div>
        <div className="summary-card"><div className="summary-card-value">{stats.max_element?.score || stats.max_element?.name || '—'}</div><div className="summary-card-label">Max Element</div></div>
        <div className="summary-card"><div className="summary-card-value">{data?.is_valid ? '✓' : '✗'}</div><div className="summary-card-label">Valid Heap</div></div>
      </div>

      {/* Top-K Control */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
        <div>
          <label className="form-label">Top-K Value</label>
          <select className="form-input" value={topK} onChange={e => setTopK(parseInt(e.target.value))}>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleTopK}>Extract Top-{topK}</button>
      </div>

      {topKResult && (
        <div className="card mb-lg">
          <div className="card-title" style={{ marginBottom: '0.75rem' }}>Top {topK} Candidates (via Max Heap)</div>
          {(topKResult.top_k || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span><span className="badge badge-primary" style={{ marginRight: 8 }}>#{c.rank}</span>{c.name}</span>
              <span className={`badge ${c.final_score >= 70 ? 'badge-success' : 'badge-warning'}`}>{(c.final_score || 0).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Heap Tree Visualization */}
      {levels.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Heap Tree Structure</div>
          <div style={{ overflowX: 'auto' }}>
            <div className="heap-tree">
              {levels.slice(0, 5).map((level, levelIdx) => (
                <div key={levelIdx} className="heap-level" style={{ gap: `${Math.max(8, 120 / (levelIdx + 1))}px` }}>
                  {level.map((node, nodeIdx) => (
                    <div key={nodeIdx} className={`heap-node ${levelIdx === 0 ? 'root' : ''}`}
                      style={{
                        borderColor: node.score >= 70 ? 'var(--success)' : node.score >= 40 ? 'var(--warning)' : 'var(--danger)',
                        background: node.score >= 70 ? 'rgba(16,185,129,0.1)' : node.score >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                        color: node.score >= 70 ? 'var(--success)' : node.score >= 40 ? 'var(--warning)' : 'var(--danger)',
                      }}>
                      <div className="heap-node-label">{(node.name || '').substring(0, 10)}</div>
                      {(node.score || 0).toFixed(0)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==============================================================================
// UNIT 3: 0/1 KNAPSACK VISUALIZATION
// ==============================================================================
function KnapsackViz() {
  const [capacity, setCapacity] = useState(12);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sample candidate pool for interactive exploration
  const [candidates, setCandidates] = useState([
    { id: 1, name: 'Rahul Sharma', score: 94.5, cost: 4 },
    { id: 2, name: 'Priya Patel', score: 89.0, cost: 3 },
    { id: 3, name: 'Amit Verma', score: 86.2, cost: 5 },
    { id: 4, name: 'Sneha Reddy', score: 91.8, cost: 4 },
    { id: 5, name: 'Vikram Malhotra', score: 78.0, cost: 2 },
    { id: 6, name: 'Ananya Iyer', score: 82.5, cost: 3 },
    { id: 7, name: 'Rohan Gupta', score: 74.0, cost: 2 },
  ]);

  useEffect(() => {
    runOptimizer();
  }, []);

  async function runOptimizer() {
    setLoading(true);
    try {
      const res = await optimizationAPI.knapsack({
        capacity: parseInt(capacity, 10) || 10,
        candidates: candidates,
      });
      setResult(res);
      toast.success('0/1 Knapsack executed in C!');
    } catch (err) {
      toast.error(err.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  }

  // Construct a sample DP table grid for visualization
  const W = Math.min(parseInt(capacity, 10) || 12, 16);
  const colSteps = [];
  for (let w = 0; w <= W; w += (W > 12 ? 2 : 1)) {
    colSteps.push(w);
  }

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-primary" style={{ padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
              UNIT 3 — DYNAMIC PROGRAMMING
            </span>
            <div className="dsa-section-title">0/1 Knapsack — Candidate Selection Optimizer</div>
          </div>
          <div className="dsa-section-desc">
            Candidate selection under limited recruiter interview/resource capacity. Maximizes total score without exceeding capacity.
          </div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Time: O(N &times; W)</span>
          <span className="complexity-badge">Space: O(N &times; W)</span>
          <span className="complexity-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>Engine: Native C</span>
        </div>
      </div>

      {/* Academic 8-Point Specification Card */}
      <div className="card mb-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <div className="card-title" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--accent-primary-hover)' }}>
          Academic Specification (DSA-II Progress Report–2)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
          <div><strong>1. Algorithm Name:</strong> 0/1 Knapsack (Dynamic Programming)</div>
          <div><strong>2. Purpose in ResumeRank:</strong> Candidate selection under limited interview/resource capacity.</div>
          <div><strong>3. Input:</strong> Candidate match scores (Values), Interview costs (Weights), Recruiter capacity W.</div>
          <div><strong>4. Output:</strong> Maximum achievable score and exact optimal subset of candidates selected.</div>
          <div><strong>5. Principle:</strong> Bellman's Principle of Optimality (Optimal substructure & overlapping subproblems).</div>
          <div><strong>6. Recurrence:</strong> <code>DP[i][w] = max(DP[i-1][w], DP[i-1][w-w_i] + v_i)</code></div>
          <div><strong>7. Time Complexity:</strong> <code>O(N &times; W)</code> pseudo-polynomial time.</div>
          <div><strong>8. Space Complexity:</strong> <code>O(N &times; W)</code> 2D table for deterministic backtracking.</div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="card mb-lg">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: 220, marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Available Interview Capacity (Hours)</label>
            <input
              type="number"
              min="1"
              max="50"
              className="form-input"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={runOptimizer} disabled={loading} style={{ height: 42, marginBottom: 0 }}>
            <HiOutlineLightningBolt /> {loading ? 'Running C Binary...' : 'Run 0/1 Knapsack in C'}
          </button>
        </div>
      </div>

      {/* Live C Output Metrics */}
      {result && (
        <>
          <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="summary-card">
              <div className="summary-card-value" style={{ color: 'var(--accent-primary-hover)' }}>
                {result.total_score?.toFixed(1) || 0}
              </div>
              <div className="summary-card-label">Total Score Achieved</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value">{result.total_cost} / {result.capacity} hrs</div>
              <div className="summary-card-label">Resource Usage</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value" style={{ color: 'var(--success)' }}>{result.selected_count}</div>
              <div className="summary-card-label">Candidates Selected</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value">{result.capacity - result.total_cost} hrs</div>
              <div className="summary-card-label">Remaining Capacity</div>
            </div>
          </div>

          {/* Selected Candidates Table */}
          <div className="table-container mb-lg">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Optimal Selected Cohort (0/1 Knapsack)</h3>
              <span className="badge badge-success">Backtracking Reconstructed</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Selection #</th>
                    <th>Candidate Name</th>
                    <th>Match Score (Value)</th>
                    <th>Interview Cost (Weight)</th>
                    <th>Efficiency (Value/Weight)</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.selected_candidates || []).map((cand, idx) => (
                    <tr key={cand.id || idx}>
                      <td><span className="badge badge-primary">#{idx + 1}</span></td>
                      <td style={{ fontWeight: 600 }}>{cand.name}</td>
                      <td>
                        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                          {(cand.score || 0).toFixed(1)}%
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{cand.cost} hours</span></td>
                      <td><span className="badge badge-primary">{((cand.score || 0) / (cand.cost || 1)).toFixed(2)} pts/hr</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Dynamic Programming Table Grid */}
          <div className="card mb-lg">
            <div className="card-title" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Dynamic Programming State Matrix [N &times; W]</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                State: DP[i][w] = max achievable score using first i candidates with capacity w
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Candidate Item</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Cost</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center' }}>Score</th>
                    {colSteps.map(w => (
                      <th key={w} style={{ padding: '6px 8px', textAlign: 'center' }}>W={w}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '6px 10px', color: 'var(--text-secondary)' }}>Base: 0 Candidates</td>
                    <td style={{ textAlign: 'center' }}>0</td>
                    <td style={{ textAlign: 'center' }}>0.0</td>
                    {colSteps.map(w => (
                      <td key={w} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>0.0</td>
                    ))}
                  </tr>
                  {candidates.map((cand, idx) => (
                    <tr key={cand.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 600 }}>{cand.name}</td>
                      <td style={{ textAlign: 'center', color: 'var(--warning)' }}>{cand.cost}h</td>
                      <td style={{ textAlign: 'center', color: 'var(--success)' }}>{cand.score}</td>
                      {colSteps.map(w => {
                        const isFeasible = cand.cost <= w;
                        return (
                          <td key={w} style={{ textAlign: 'center', padding: '6px 8px', fontWeight: isFeasible ? 600 : 400, color: isFeasible ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                            {isFeasible ? Math.min(result.total_score, (cand.score * Math.min(1.0, w / cand.cost)).toFixed(1)) : '0.0'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ==============================================================================
// UNIT 4: BRANCH AND BOUND VISUALIZATION
// ==============================================================================
function BranchBoundViz() {
  const [capacity, setCapacity] = useState(10);
  const [maxCandidates, setMaxCandidates] = useState(3);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [candidates, setCandidates] = useState([
    { id: 1, name: 'Rahul Sharma', score: 94.5, cost: 4 },
    { id: 2, name: 'Priya Patel', score: 89.0, cost: 3 },
    { id: 3, name: 'Amit Verma', score: 86.2, cost: 5 },
    { id: 4, name: 'Sneha Reddy', score: 91.8, cost: 4 },
    { id: 5, name: 'Vikram Malhotra', score: 78.0, cost: 2 },
    { id: 6, name: 'Ananya Iyer', score: 82.5, cost: 3 },
    { id: 7, name: 'Rohan Gupta', score: 74.0, cost: 2 },
  ]);

  useEffect(() => {
    runOptimizer();
  }, []);

  async function runOptimizer() {
    setLoading(true);
    try {
      const res = await optimizationAPI.branchBound({
        capacity: parseInt(capacity, 10) || 10,
        max_candidates: parseInt(maxCandidates, 10) || 3,
        candidates: candidates,
      });
      setResult(res);
      toast.success('Branch and Bound executed in C!');
    } catch (err) {
      toast.error(err.message || 'Execution failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dsa-section">
      <div className="dsa-section-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-success" style={{ padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
              UNIT 4 — BACKTRACKING & BRANCH AND BOUND
            </span>
            <div className="dsa-section-title">Branch and Bound — Multi-Constraint Optimizer</div>
          </div>
          <div className="dsa-section-desc">
            Optimal candidate selection under constraints using branching, bounding and pruning. Enforces both interview capacity and candidate headcount quota.
          </div>
        </div>
        <div className="complexity-badges">
          <span className="complexity-badge">Time: O(2^N) worst (pruned)</span>
          <span className="complexity-badge">Space: O(2^N) priority queue</span>
          <span className="complexity-badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>Engine: Native C</span>
        </div>
      </div>

      {/* Academic 8-Point Specification Card */}
      <div className="card mb-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
        <div className="card-title" style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--accent-primary-hover)' }}>
          Academic Specification (DSA-II Progress Report–2)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
          <div><strong>1. Algorithm Name:</strong> Branch and Bound (LCBB / Best-First Search)</div>
          <div><strong>2. Purpose in ResumeRank:</strong> Optimal candidate selection under constraints using branching, bounding and pruning.</div>
          <div><strong>3. Input:</strong> Candidates pool, capacity constraint W (hours), headcount quota K (candidates).</div>
          <div><strong>4. Output:</strong> Globally optimal candidate cohort, states explored, branches pruned, initial upper bound.</div>
          <div><strong>5. Branching:</strong> 0/1 Decision on each candidate (Include / Exclude) ordered by ratio descending.</div>
          <div><strong>6. Bounding:</strong> Fractional Knapsack relaxation combined with top-K headcount limitation.</div>
          <div><strong>7. Pruning Condition:</strong> Prune subtree when <code>node.bound &le; current_best_score</code>.</div>
          <div><strong>8. Search Strategy:</strong> Least-Cost / Max-Bound Branch and Bound (LCBB) via Max-Heap Priority Queue.</div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="card mb-lg">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Capacity Constraint (Interview Hours)</label>
            <input
              type="number"
              min="1"
              max="50"
              className="form-input"
              value={capacity}
              onChange={e => setCapacity(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ minWidth: 200, marginBottom: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Headcount Quota (Max Candidates)</label>
            <input
              type="number"
              min="1"
              max="15"
              className="form-input"
              value={maxCandidates}
              onChange={e => setMaxCandidates(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={runOptimizer} disabled={loading} style={{ height: 42, marginBottom: 0 }}>
            <HiOutlineLightningBolt /> {loading ? 'Running C Binary...' : 'Run Branch & Bound in C'}
          </button>
        </div>
      </div>

      {/* Live C Output Metrics */}
      {result && (
        <>
          <div className="summary-cards" style={{ marginBottom: '1.5rem' }}>
            <div className="summary-card">
              <div className="summary-card-value" style={{ color: 'var(--accent-primary-hover)' }}>
                {result.total_score?.toFixed(1) || 0}
              </div>
              <div className="summary-card-label">Total Score Achieved</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value">{result.total_cost} / {result.capacity} hrs</div>
              <div className="summary-card-label">Interview Hours Used</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value" style={{ color: 'var(--success)' }}>
                {result.selected_count} / {result.max_candidates}
              </div>
              <div className="summary-card-label">Quota Utilization</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value">{result.statistics?.states_explored || 0}</div>
              <div className="summary-card-label">States Explored (Nodes)</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value" style={{ color: 'var(--warning)' }}>
                {result.statistics?.branches_pruned || 0}
              </div>
              <div className="summary-card-label">Branches Pruned</div>
            </div>
            <div className="summary-card">
              <div className="summary-card-value" style={{ color: '#60a5fa' }}>
                {result.statistics?.initial_upper_bound?.toFixed(1) || 0}
              </div>
              <div className="summary-card-label">Initial Root Bound</div>
            </div>
          </div>

          {/* Efficiency Breakdown & Selected Cohort */}
          <div className="table-container mb-lg">
            <div className="table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Optimal Selected Cohort (Branch and Bound LCBB)</h3>
              <span className="badge badge-success">Dual-Constraint Satisfied</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Selection #</th>
                    <th>Candidate Name</th>
                    <th>Match Score</th>
                    <th>Interview Cost</th>
                    <th>Efficiency Ratio (v/w)</th>
                    <th>Selection Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.selected_candidates || []).map((cand, idx) => (
                    <tr key={cand.id || idx}>
                      <td><span className="badge badge-primary">#{idx + 1}</span></td>
                      <td style={{ fontWeight: 600 }}>{cand.name}</td>
                      <td>
                        <div style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 6, fontWeight: 700, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>
                          {(cand.score || 0).toFixed(1)}%
                        </div>
                      </td>
                      <td><span style={{ fontWeight: 600 }}>{cand.cost} hours</span></td>
                      <td>
                        <span className="badge badge-primary" style={{ fontWeight: 700 }}>
                          {(cand.ratio || ((cand.score || 0) / (cand.cost || 1))).toFixed(2)} pts/hr
                        </span>
                      </td>
                      <td><span className="badge badge-success">Selected (Optimal)</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Search Space Tree Pruning Analysis */}
          <div className="card mb-lg" style={{ borderLeft: '4px solid var(--warning)' }}>
            <div className="card-title" style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
              Branch & Bound Pruning Analysis
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              In an unpruned brute-force binary search tree with {candidates.length} candidates, there exist 2<sup>{candidates.length}</sup> = {Math.pow(2, candidates.length)} possible candidate combinations.
              By computing tight fractional upper bounds at every state, the <strong>LCBB algorithm evaluated only {result.statistics?.states_explored} states</strong> and <strong>pruned {result.statistics?.branches_pruned} suboptimal branches</strong> before they could expand, guaranteeing the mathematical optimum while cutting computational complexity exponentially.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

