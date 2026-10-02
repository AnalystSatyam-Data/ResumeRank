import { useState, useEffect } from 'react';
import { dsaAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch } from 'react-icons/hi';

export default function DSAVisualization() {
  const [activeTab, setActiveTab] = useState('hash');

  const tabs = [
    { id: 'hash', label: 'Hash Table' },
    { id: 'trie', label: 'Trie' },
    { id: 'graph', label: 'Graph' },
    { id: 'mergesort', label: 'Merge Sort' },
    { id: 'heap', label: 'Max Heap' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="page-header"><h1>DSA Visualization</h1><p>Interactive visualization of data structures used in the ranking system</p></div>
      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {activeTab === 'hash' && <HashTableViz />}
      {activeTab === 'trie' && <TrieViz />}
      {activeTab === 'graph' && <GraphViz />}
      {activeTab === 'mergesort' && <MergeSortViz />}
      {activeTab === 'heap' && <MaxHeapViz />}
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
