# ALGORITHMS.md — The First 50, Classified

Classification follows the common **interview-pattern taxonomy** (the same families used by
most prep courses), because the site teaches *patterns*, not isolated tricks. Each category
maps to one renderer (see ARCHITECTURE.md) and one accent color (see DESIGN.md).

Difficulty: 🟢 easy · 🟡 medium · 🔴 hard.
Build order within Phase 1–2 = table order (top categories first).

This file classifies the same 50 algorithms **three ways**:
1. **By pattern** (§ categories 1–10 below) — how the site's catalog is organized, because
   patterns are what transfer to new problems.
2. **By academic paradigm** (§ Academic classification) — the textbook taxonomy
   (divide & conquer, greedy, DP…), shown as a secondary tag on each algorithm page.
3. **By difficulty** (§ Difficulty index) — a suggested learning path.

## How many algorithms are there, anyway?

There is no fixed number — "algorithm" just means a defined procedure, so new ones are
invented constantly. But the useful canons are surprisingly small:

| Canon | Rough size |
|---|---|
| Classic textbook core (CLRS / Sedgewick — sorting, searching, graphs, DP, strings) | ~40–60 named algorithms |
| Interview-prep canon (Blind 75, NeetCode 150, Grind 169) | ~75–170 *problems*, built from ~20 reusable patterns |
| Competitive programming | several hundred techniques, most beyond interview scope |

**Practical takeaway:** mastering ~20 patterns ≈ solving most of the interview canon.
Our 50 covers essentially the whole textbook core plus the highest-frequency patterns;
expanding to ~100 (Phase 2+ notes at the bottom) would cover nearly everything an
interview can ask.

## 1. Sorting — violet · `ArrayView` (bars)
The best animations on the site; build these first to prove the engine.

| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 1 | Bubble Sort | 🟢 | O(n²) | adjacent compare pair, swap arcs, sorted tail turns green |
| 2 | Selection Sort | 🟢 | O(n²) | scanning cursor, current-min highlight, one swap per pass |
| 3 | Insertion Sort | 🟢 | O(n²) | lifted element floats above, slides left over shifting bars |
| 4 | Merge Sort | 🟡 | O(n log n) | halves split apart, merge zip animation |
| 5 | Quick Sort | 🟡 | O(n log n) | pivot glows, partition pointers, subrange brackets |
| 6 | Heap Sort | 🟡 | O(n log n) | sift-down bubbling in mirrored tree strip |
| 7 | Counting Sort | 🟡 | O(n+k) | counts filling a second array, stable write-back |
| 8 | Radix Sort (LSD) | 🟡 | O(nk) | digit-of-focus highlighted, bucket redistribution |

## 2. Arrays & Two Pointers — cyan · `ArrayView` (boxes)
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 9 | Two Sum (sorted, two pointers) | 🟢 | O(n) | `lo`/`hi` chevrons walking inward, sum readout |
| 10 | Reverse Array In-Place | 🟢 | O(n) | mirrored swaps meeting in the middle |
| 11 | Valid Palindrome | 🟢 | O(n) | matching char pairs pulse green / mismatch red |
| 12 | Move Zeroes (slow/fast) | 🟢 | O(n) | slow/fast pointers, zeroes drifting right |
| 13 | Dutch National Flag (3-way partition) | 🟡 | O(n) | three growing colored regions |
| 14 | Container With Most Water | 🟡 | O(n) | water area fills between bars, best-so-far ghost |
| 15 | Sliding Window Maximum (monotonic deque) | 🔴 | O(n) | window bracket sliding, deque shown beneath |
| 16 | Longest Substring Without Repeating Chars | 🟡 | O(n) | window grows/shrinks, duplicate flash |
| 17 | Prefix Sum + Range Query | 🟢 | O(n) | prefix array building, range = two-value subtraction |
| 18 | Kadane's Max Subarray | 🟡 | O(n) | running sum meter, best range trail in yellow |

## 3. Searching — emerald · `ArrayView` (boxes)
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 19 | Linear Search | 🟢 | O(n) | cursor sweep, hit pulse |
| 20 | Binary Search | 🟢 | O(log n) | discarded half dims, mid glows |
| 21 | First/Last Occurrence (binary variants) | 🟡 | O(log n) | boundary squeeze animation |
| 22 | Search in Rotated Sorted Array | 🟡 | O(log n) | sorted-half detection tint |

## 4. Linked List — rose · `LinkedListView`
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 23 | Reverse Linked List | 🟢 | O(n) | arrows flip one by one, prev/curr/next pointers |
| 24 | Detect Cycle (Floyd slow/fast) | 🟡 | O(n) | two runners at different speeds, collision flash |
| 25 | Merge Two Sorted Lists | 🟢 | O(n+m) | nodes zip into one list |
| 26 | Find Middle (slow/fast) | 🟢 | O(n) | fast reaches end as slow lands mid |

## 5. Stack & Queue — amber · `StackQueueView`
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 27 | Valid Parentheses | 🟢 | O(n) | chars push/pop, mismatch shakes red |
| 28 | Min Stack | 🟢 | O(1)/op | twin stacks moving together |
| 29 | Next Greater Element (monotonic stack) | 🟡 | O(n) | pops cascade when a bigger value arrives |
| 30 | Queue via Two Stacks | 🟢 | O(1) amort. | pour-over animation between stacks |

## 6. Trees — green · `TreeView`
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 31 | BFS Level-Order Traversal | 🟢 | O(n) | levels light up as waves, queue strip below |
| 32 | DFS Traversals (pre/in/post, tabbed) | 🟢 | O(n) | walker crawling edges, output tape builds |
| 33 | BST Insert & Search | 🟢 | O(log n) | comparison path glows, new node drops in |
| 34 | Validate BST (min/max bounds) | 🟡 | O(n) | allowed-range labels per node, violation flash |
| 35 | Max Depth | 🟢 | O(n) | depths bubble up from leaves |
| 36 | Invert Binary Tree | 🟢 | O(n) | subtrees swing around their parent |
| 37 | Lowest Common Ancestor | 🟡 | O(n) | two paths climb, meeting node crowns |

## 7. Heap — pink · `TreeView` + array strip
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 38 | Heapify / Build-Heap | 🟡 | O(n) | sift-downs rippling bottom-up, tree+array in sync |
| 39 | Top-K Elements (min-heap of size k) | 🟡 | O(n log k) | stream enters, small elements ejected |

## 8. Graphs — blue · `GraphView` / `GridView`
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 40 | Graph BFS | 🟢 | O(V+E) | frontier expands as rings, queue strip |
| 41 | Graph DFS | 🟢 | O(V+E) | deep probe with backtrack dimming |
| 42 | Number of Islands (grid flood fill) | 🟡 | O(mn) | islands flood with distinct colors |
| 43 | Topological Sort (Kahn's) | 🟡 | O(V+E) | in-degree counters tick down, nodes fall into order |
| 44 | Dijkstra Shortest Path | 🔴 | O(E log V) | tentative distances relax, final path traces yellow |
| 45 | Union-Find (with path compression) | 🟡 | O(α(n)) | forests merge, compression flattens chains |

## 9. Dynamic Programming — fuchsia · `GridView` / `ArrayView`
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 46 | Climbing Stairs (fib, memo) | 🟢 | O(n) | cells fill left→right from their two parents |
| 47 | Coin Change (min coins) | 🟡 | O(n·amount) | row fills, contributing cell arrows |
| 48 | Longest Common Subsequence | 🟡 | O(nm) | 2D table fills diagonally, traceback path |
| 49 | House Robber | 🟢 | O(n) | rob/skip choice branches, running best |

## 10. Backtracking — orange · `GridView` / `TreeView`
| # | Algorithm | Diff | Complexity | What lights up |
|---|---|---|---|---|
| 50 | N-Queens | 🟡 | O(n!) | queens place, conflicts flash, backtrack rewinds |

## Academic classification (textbook paradigms)

The classical taxonomy from CLRS-style textbooks, mapped onto the same 50 algorithms.
Each algorithm page shows its paradigm as a small secondary tag next to the pattern
category. Some algorithms legitimately belong to two paradigms — both tags are shown.

| Paradigm | Idea | Algorithms (by # above) |
|---|---|---|
| **Brute force / simple iteration** | Try everything directly | 1 Bubble, 2 Selection, 3 Insertion, 19 Linear Search |
| **Divide & Conquer** | Split, solve halves, combine | 4 Merge Sort, 5 Quick Sort, 20 Binary Search, 21 Occurrence variants, 22 Rotated Search |
| **Non-comparison sorting** | Exploit value structure instead of comparing | 7 Counting Sort, 8 Radix Sort |
| **Linear scanning techniques** (two pointers / sliding window / prefix) | One pass with clever bookkeeping | 9–17, 24 Floyd Cycle, 26 Find Middle |
| **Greedy** | Locally best choice is globally safe | 14 Container With Most Water, 44 Dijkstra (greedy + graph) |
| **Dynamic Programming** | Overlapping subproblems + memo/table | 18 Kadane, 46 Climbing Stairs, 47 Coin Change, 48 LCS, 49 House Robber |
| **Backtracking / exhaustive search** | Explore, undo, explore again | 50 N-Queens |
| **Graph theory** | Traversal, ordering, shortest path, connectivity | 31–32 (tree traversals), 40 BFS, 41 DFS, 42 Islands, 43 Topological Sort, 44 Dijkstra, 45 Union-Find |
| **Data-structure operations** | The structure IS the algorithm | 23 Reverse List, 25 Merge Lists, 27–30 (stack/queue), 33 BST ops, 34 Validate BST, 35–37 (tree recursion), 38 Heapify, 39 Top-K |

Notably: the **pattern taxonomy** answers "when do I reach for this?" while the
**academic taxonomy** answers "why does this work?" — the site teaches with the first
and labels with the second.

## Difficulty index (suggested learning path)

**🟢 Easy — 25 algos. Start here; each teaches one clean idea.**
1 Bubble · 2 Selection · 3 Insertion · 9 Two Sum · 10 Reverse Array · 11 Palindrome ·
12 Move Zeroes · 17 Prefix Sum · 19 Linear Search · 20 Binary Search · 23 Reverse List ·
25 Merge Lists · 26 Find Middle · 27 Parentheses · 28 Min Stack · 30 Queue via Stacks ·
31 BFS Level-Order · 32 DFS Traversals · 33 BST Insert/Search · 35 Max Depth ·
36 Invert Tree · 40 Graph BFS · 41 Graph DFS · 46 Climbing Stairs · 49 House Robber

**🟡 Medium — 23 algos. Combinations of easy ideas; the interview sweet spot.**
4 Merge Sort · 5 Quick Sort · 6 Heap Sort · 7 Counting Sort · 8 Radix Sort ·
13 Dutch Flag · 14 Container Water · 16 Longest Substring · 18 Kadane ·
21 First/Last Occurrence · 22 Rotated Search · 24 Floyd Cycle · 29 Next Greater ·
34 Validate BST · 37 LCA · 38 Heapify · 39 Top-K · 42 Islands · 43 Topological Sort ·
45 Union-Find · 47 Coin Change · 48 LCS · 50 N-Queens

**🔴 Hard — 2 algos. Save for last.**
15 Sliding Window Maximum · 44 Dijkstra

Recommended path: all 🟢 in catalog order → 🟡 sorting & arrays → 🟡 structures
(list/stack/tree/heap) → 🟡 graphs & DP → 🔴. The catalog page should offer
"sort by difficulty" as a toggle alongside the default pattern grouping.

## Notes for the builder
- 50 is the v1 cap, not the ceiling. Obvious Phase-2+ additions: Subsets & Permutations
  (backtracking), 0/1 Knapsack (DP), KMP (strings — would need a new category), A*, Trie.
- Greedy (teal) is reserved in the design system but has no v1 entries; Interval
  Scheduling and Jump Game are the first candidates when expanding.
- Every entry above = one `AlgoModule` file (see ARCHITECTURE.md). The "What lights up"
  column is the acceptance criterion for that algorithm's animation.
