# ResumeRank — Resume Indexing and Candidate Ranking Tool

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-lightgrey.svg)](https://palletsprojects.com/p/flask/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev)

A modern, full-stack **Applicant Tracking & Resume Screening System** engineered specifically for a College Project-Based Learning (PBL) demonstration. The system indexes candidate resumes, analyzes skill profiles, calculates multi-factor ranking scores against job requirements, and provides an **interactive Data Structures and Algorithms (DSA) visualization suite** to demonstrate how classic CS algorithms solve real-world recruitment bottlenecks.

---

## 🌟 Key Features

1. **Recruiter Dashboard**
   - Live metrics: Total candidates, active jobs, indexed skills, average scores.
   - Quick action shortcuts, recent candidates, and top candidate highlights.

2. **Resume Parser & Multi-File Upload**
   - Drag-and-drop support for PDF and DOCX resumes.
   - Automatic extraction of candidate name, email, phone, education, experience, skills, and projects.
   - Skill dictionary normalization with automatic synonym matching.

3. **Candidate Directory & In-Depth Profile**
   - Full candidate details with parsed contact info, experience timeline, and project catalog.
   - Status transitions (`Applied`, `Screening`, `Shortlisted`, `Rejected`, `Hired`).
   - Quick search, status filter, and pagination.

4. **Job Opening Management**
   - Create, edit, and close job postings.
   - Define minimum experience, education criteria, required skills, and preferred bonus skills.
   - Instant 1-click candidate ranking against any job requirement.

5. **Multi-Factor Candidate Ranking Engine**
   - Deterministic weighted scoring based on:
     - Skill Match: 50%
     - Experience: 20%
     - Education: 15%
     - Projects: 10%
     - Certifications: 5%
   - Configurable scoring weights with real-time validation.
   - Instant filtering by minimum score, shortlist status, and Top-K candidates.

6. **Candidate Side-by-Side Comparison**
   - Compare up to 4 candidates simultaneously.
   - Overlap matrices for skills, experience differentials, project count, and match scores.

7. **Interactive DSA Visualization Suite (PBL Core)**
   - **Hash Table**: Separate chaining collision resolution visualization, bucket inspection, and polynomial rolling hash calculation.
   - **Trie (Prefix Tree)**: Live prefix search, dynamic node rendering, and sub-millisecond autocomplete.
   - **Graph**: Bipartite Candidate-Skill network with interactive BFS/DFS traversal logs.
   - **Merge Sort**: Step-by-step Divide and Conquer visualizer showing split and merge passes with deterministic tie-breaking.
   - **Max Heap**: Array-based binary max heap with real-time sift-up and sift-down node swaps and Top-$K$ extraction in $O(K \log N)$.

8. **Recruitment Analytics & Insights**
   - Score distribution histograms, most in-demand skills bar chart, experience breakdown, and status funnels using Recharts.

9. **Configurable Settings**
   - Dynamic skill dictionary management (add/remove recognized technical skills).
   - Adjust scoring weight distributions with real-time validation.

---

## 🔬 DSA Architecture & Complexity Analysis

| Data Structure / Algorithm | File Location | Purpose in ATS | Time Complexity | Space Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **Hash Table** (Separate Chaining) | `backend/dsa/hash_table.py` | Inverted index mapping skills to candidate IDs | Average: $O(1)$ lookup<br>Worst: $O(N)$ | $O(N + M)$ |
| **Trie** (Prefix Tree) | `backend/dsa/trie.py` | Fast skill prefix search & search autocomplete | Search: $O(L)$<br>Insert: $O(L)$<br>($L$ = length of prefix) | $O(\Sigma \times L \times N)$ |
| **Bipartite Graph** (Adjacency List) | `backend/dsa/graph.py` | Relationship graph between Candidates & Skills; BFS/DFS skill clusters | Traversal: $O(V + E)$<br>Add Edge: $O(1)$ | $O(V + E)$ |
| **Merge Sort** | `backend/dsa/merge_sort.py` | Stable ranking of candidates by composite score with deterministic tie-breaking | Best/Avg/Worst: $O(N \log N)$ | $O(N)$ |
| **Max Heap** (Binary Heap) | `backend/dsa/max_heap.py` | Priority Queue for Top-$K$ candidate retrieval without sorting entire pool | Insert: $O(\log N)$<br>Extract Max: $O(\log N)$<br>Top-$K$: $O(K \log N)$ | $O(N)$ |

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Python 3.10+** (Tested on Python 3.13)
- **Node.js 18+** & npm

### One-Click Launch (Windows)
Double-click `run.bat` or run:
```powershell
.\run.bat
```
Or with PowerShell:
```powershell
.\start.ps1
```

---

### Manual Launch

#### 1. Backend (Flask)
```bash
# Install dependencies
pip install -r requirements.txt

# Start the Flask API server (seeds sample data automatically on first run)
python backend/app.py
```
*Backend defaults to `http://localhost:5001` (health: `http://localhost:5001/api/health`). Set `PORT` to use another port.*

#### 2. Frontend (React + Vite)
```bash
cd frontend

# Optional: copy .env.example to .env.local to override the backend URL
# cp .env.example .env.local

# Install packages
npm install

# Start Vite development server
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

The frontend API client reads `VITE_API_URL` (default `http://localhost:5001`). If the backend port changes, set the same URL in `frontend/.env.local` and set `PORT` when starting Flask, for example:

```bash
# Backend terminal
PORT=5002 python backend/app.py

# frontend/.env.local
VITE_API_URL=http://localhost:5001
```

For the default setup, run these in separate terminals:

```bash
# Terminal 1
cd frontend
npm install
npm run dev
```

```bash
# Terminal 2 (from the project root)
pip install -r requirements.txt
python backend/app.py
```

---

## 🧪 Running Automated Tests

Run the test suite covering all 5 custom DSA data structures and all REST API endpoints:
```bash
pytest -v
```
Output:
```
======================== 22 passed in 1.53s ========================
```

---

## 📂 Project Structure

```
Resume Indexing and Candidate Ranking Tool/
├── backend/
│   ├── dsa/                       # Custom CS data structure implementations
│   │   ├── hash_table.py          # Polynomial rolling hash + separate chaining
│   │   ├── trie.py                # Prefix tree for skill autocomplete
│   │   ├── graph.py               # Candidate-skill bipartite graph + BFS/DFS
│   │   ├── merge_sort.py          # Divide-and-conquer candidate ranker
│   │   └── max_heap.py            # Array-based binary max heap for Top-K
│   ├── models/
│   │   └── models.py              # SQLAlchemy ORM (Candidate, Job, Skill, Ranking)
│   ├── routes/
│   │   ├── candidates.py          # Candidates CRUD & status endpoints
│   │   ├── jobs.py                # Jobs CRUD & ranking generation endpoints
│   │   ├── resumes.py             # Multi-format resume upload & parser
│   │   └── search_analytics.py    # Search, Analytics & DSA Visualization APIs
│   ├── services/
│   │   ├── ranking_engine.py      # Weighted multi-factor candidate scoring engine
│   │   └── resume_parser.py       # Regex & NLP pattern resume extractor
│   ├── database/                  # SQLite database storage
│   ├── app.py                     # Flask application entry point
│   └── seed.py                    # Pre-populated realistic candidates & job data
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx        # Responsive navigation sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Overview dashboard & KPI cards
│   │   │   ├── Candidates.jsx     # Candidate directory & search
│   │   │   ├── CandidateDetail.jsx# Full candidate dossier
│   │   │   ├── Upload.jsx         # Drag-and-drop resume ingestion
│   │   │   ├── Jobs.jsx           # Job openings directory
│   │   │   ├── CreateJob.jsx      # Job opening creation form
│   │   │   ├── JobDetail.jsx      # Job requirements view
│   │   │   ├── Rankings.jsx       # Ranked candidates with score breakdowns
│   │   │   ├── Compare.jsx        # 4-way candidate comparator
│   │   │   ├── SkillSearch.jsx    # Real-time Trie-powered search
│   │   │   ├── Analytics.jsx      # Charts & recruitment analytics
│   │   │   ├── DSAVisualization.jsx# Interactive DSA demonstration laboratory
│   │   │   └── Settings.jsx       # Scoring weight & dictionary config
│   │   ├── services/
│   │   │   └── api.js             # Unified REST client
│   │   ├── App.jsx                # Application router & theme setup
│   │   └── index.css              # Custom dark-mode design system & animations
│   ├── package.json
│   └── vite.config.js             # Vite config with API proxy
├── tests/
│   ├── test_dsa.py                # 12 Unit tests for Hash Table, Trie, Graph, Heap, Sort
│   └── test_api.py                # 8 Integration tests for Flask REST endpoints
├── pytest.ini                     # Pytest configuration
├── requirements.txt               # Backend Python dependencies
├── run.bat                        # Windows launch batch script
└── start.ps1                      # Windows PowerShell launch script
```

