
import { MapNode } from '../types';
import { nodes, edges } from '../data/mapData';

// A more robust fuzzy search to find a location node.
export function findLocation(query: string): MapNode | null {
  const lowerQuery = query.toLowerCase().trim().replace(/[^a-z0-9\s]/gi, '');
  
  if (!lowerQuery) return null;

  // 1. Exact ID match (e.g., "B101")
  const upperId = lowerQuery.toUpperCase();
  if (nodes[upperId]) {
    return nodes[upperId];
  }

  let bestMatch: MapNode | null = null;
  let highestScore = 0;

  const queryWords = new Set(lowerQuery.split(' ').filter(w => w.length > 1));

  for (const node of Object.values(nodes)) {
    const checks = [node.name, ...(node.aliases || [])];
    
    for (const check of checks) {
      const lowerCheck = check.toLowerCase().replace(/[^a-z0-9\s]/gi, '');
      
      // 2. Exact name/alias match
      if (lowerCheck === lowerQuery) {
        return node;
      }

      // 3. Fuzzy scoring
      let currentScore = 0;
      const checkWords = new Set(lowerCheck.split(' ').filter(w => w.length > 1));

      // Score for query contained in check string
      if (lowerCheck.includes(lowerQuery)) {
          currentScore += 10 * (lowerQuery.length / lowerCheck.length);
      }
      
      // Score for check string contained in query
      if (lowerQuery.includes(lowerCheck)) {
          currentScore += 10 * (lowerCheck.length / lowerQuery.length);
      }

      // Score for matching words
      let matchingWords = 0;
      for (const queryWord of queryWords) {
        if (checkWords.has(queryWord)) {
          matchingWords++;
        }
      }
      currentScore += matchingWords * 2; // Weight word matches highly

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestMatch = node;
      }
    }
  }

  // Only return a match if it's reasonably confident
  if (highestScore > 2) { 
    return bestMatch;
  }

  return null;
}

// Dijkstra's algorithm to find the shortest path
export function findShortestPath(startNodeId: string, endNodeId: string): MapNode[] | null {
  const distances: { [key: string]: number } = {};
  const prev: { [key: string]: string | null } = {};
  const pq = new Set<string>();

  for (const nodeId in nodes) {
    distances[nodeId] = Infinity;
    prev[nodeId] = null;
    pq.add(nodeId);
  }

  distances[startNodeId] = 0;

  const adj: { [key: string]: { node: string; weight: number }[] } = {};
  for(const edge of edges) {
    if(!adj[edge.source]) adj[edge.source] = [];
    if(!adj[edge.target]) adj[edge.target] = [];
    adj[edge.source].push({ node: edge.target, weight: edge.weight });
    adj[edge.target].push({ node: edge.source, weight: edge.weight });
  }

  while (pq.size > 0) {
    let u: string | null = null;
    for (const nodeId of pq) {
      if (u === null || distances[nodeId] < distances[u]) {
        u = nodeId;
      }
    }

    if (u === null || u === endNodeId) break;

    pq.delete(u);

    const neighbors = adj[u] || [];
    for (const { node: v, weight } of neighbors) {
      const alt = distances[u] + weight;
      if (alt < distances[v]) {
        distances[v] = alt;
        prev[v] = u;
      }
    }
  }

  const path: MapNode[] = [];
  let current: string | null = endNodeId;
  while (current) {
    path.unshift(nodes[current]);
    current = prev[current];
  }
  
  if (path.length > 0 && path[0].id === startNodeId) {
    return path;
  }

  return null; // Path not found
}