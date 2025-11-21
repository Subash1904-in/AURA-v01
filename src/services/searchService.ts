import { collegeDatabase } from '../data/collegeData';
import type { Department } from '../types';
import { fetchRagContext, type RagSnippet, RagClientError } from './ragClient';
import { QueryIntent, classifyIntent } from './intentService';

export { QueryIntent, classifyIntent } from './intentService';

// Search result with relevance scoring
export interface SearchResult {
  content: string;
  relevance: number;
  source: string;
    case QueryIntent.PLACEMENT: {
      const placementStats = collegeDatabase.placements.batchStatistics;
      let placementInfo = `Placement Overview:\n${collegeDatabase.placements.description}\n\n`;

      if (placementStats && placementStats.length > 0) {
        placementInfo += "Batch-wise Statistics:\n";
        placementStats.forEach(bs => {
          placementInfo += `- ${bs.batch}: ${bs.totalCompanies} companies visited\n`;
          if (bs.examples) {
            placementInfo += `  Examples: ${bs.examples.slice(0, 5).join(', ')}\n`;
          }
        });
      }

      placementInfo += `\nTop Recruiters (sample): ${collegeDatabase.placements.recruiters.slice(0, 15).join(', ')}`;
      return placementInfo;
    }
  'package': ['salary', 'ctc', 'compensation', 'pay'],
  
  // Admissions
  'admission': ['admissions', 'join', 'enroll', 'enrollment', 'apply', 'application'],
  'eligibility': ['eligible', 'criteria', 'requirements', 'qualification', 'qualifications'],
  
  // Facilities
  'hostel': ['accommodation', 'residence', 'boarding', 'dorm', 'dormitory', 'rooms'],
  'library': ['books', 'reading room', 'study hall'],
  'lab': ['laboratory', 'laboratories', 'workshop', 'practical'],
  'gym': ['gymnasium', 'fitness', 'workout', 'exercise'],
  
  // Contact
  'contact': ['phone', 'mobile', 'email', 'reach', 'call', 'telephone', 'number'],
  'director': ['head', 'hod', 'incharge', 'principal', 'dean'],
  
  // Departments
  'cse': ['computer science', 'cs', 'computer engineering'],
  'ece': ['electronics', 'communication', 'ec', 'electronics and communication'],
  'aids': ['ai', 'data science', 'artificial intelligence', 'ai & ds', 'ai and ds'],
  'civil': ['civil engineering'],
  'mech': ['mechanical', 'mechanical engineering', 'me'],
  
  // Sports
  'sports': ['games', 'athletics', 'physical education', 'sports activities'],
  'cricket': ['bat', 'ball', 'bowling', 'batting'],
  'football': ['soccer'],
  'volleyball': ['volley ball']
};

// Expand query with synonyms
function expandQueryWithSynonyms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expandedTerms: Set<string> = new Set([query.toLowerCase()]);
  
  words.forEach(word => {
    expandedTerms.add(word);
    for (const [key, synonyms] of Object.entries(SYNONYMS)) {
      if (key === word || synonyms.includes(word)) {
        expandedTerms.add(key);
        synonyms.forEach(syn => expandedTerms.add(syn));
      }
    }
  });
  
  return Array.from(expandedTerms);
}

const RAG_CONTENT_LIMIT = 1200;

function mapRagSnippetToSearchResult(snippet: RagSnippet, intent: QueryIntent): SearchResult {
  const primary = snippet.fullText?.trim() || snippet.shortSummary || '';
  const truncated = primary.length > RAG_CONTENT_LIMIT ? `${primary.slice(0, RAG_CONTENT_LIMIT)}…` : primary;
  return {
    content: truncated,
    relevance: Number(snippet.score.toFixed(3)),
    source: snippet.sourcePath ?? snippet.section ?? 'rag',
    intent,
    metadata: {
      snippetId: snippet.id,
      section: snippet.section,
      title: snippet.title,
      tags: snippet.tags,
      sourcePath: snippet.sourcePath,
      updatedAt: snippet.updatedAt,
    },
  };
}

async function tryRagSearch(query: string, intent: QueryIntent, maxResults: number) {
  try {
    const { results, formattedContext } = await fetchRagContext(query, intent, maxResults);
    if (!results.length) {
      return null;
    }
    const normalized = results.slice(0, maxResults).map((snippet) => mapRagSnippetToSearchResult(snippet, intent));
    return { results: normalized, formattedContext };
  } catch (error) {
    if (error instanceof RagClientError && error.status === 503) {
      console.warn('[searchService] RAG index missing; falling back to heuristic search.');
      return null;
    }
    console.warn('[searchService] RAG retrieval failed, falling back to heuristics.', error);
    return null;
  }
}

// Fuzzy matching score (simple Levenshtein-based)
function fuzzyMatch(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  if (longer.includes(shorter)) return 0.8;
  
  // Simple substring matching
  const longerLower = longer.toLowerCase();
  const shorterLower = shorter.toLowerCase();
  
  if (longerLower.includes(shorterLower)) return 0.7;
  
  // Word boundary matching
  const shorterWords = shorterLower.split(/\s+/);
  const matchedWords = shorterWords.filter(word => 
    longerLower.includes(word) && word.length > 2
  );
  
  return matchedWords.length / shorterWords.length * 0.6;
}

// Calculate relevance score
function calculateRelevance(content: string, expandedTerms: string[]): number {
  const contentLower = content.toLowerCase();
  let score = 0;
  
  expandedTerms.forEach(term => {
    if (contentLower.includes(term)) {
      // Boost score for exact matches
      const termRegex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = contentLower.match(termRegex);
      score += matches ? matches.length * 0.5 : 0.2;
    }
  });
  
  return Math.min(score, 10); // Cap at 10
}

// Search across college data with RAG first, keyword fallback second
export async function searchWithContext(query: string, maxResults = 5): Promise<SearchResponse> {
  const intent = classifyIntent(query);
  const ragResult = await tryRagSearch(query, intent, maxResults);
  if (ragResult) {
    return {
      intent,
      usedRag: true,
      formattedContext: ragResult.formattedContext,
      results: ragResult.results,
    };
  }

  const fallbackResults = runHeuristicSearch(query, intent, maxResults);
  return {
    intent,
    usedRag: false,
    results: fallbackResults,
  };
}

export async function searchCollegeData(query: string, maxResults = 5): Promise<SearchResult[]> {
  const { results } = await searchWithContext(query, maxResults);
  return results;
}

function runHeuristicSearch(query: string, intent: QueryIntent, maxResults: number): SearchResult[] {
  const expandedTerms = expandQueryWithSynonyms(query);
  const results: SearchResult[] = [];

  if (intent === QueryIntent.PLACEMENT || intent === QueryIntent.GENERAL) {
    const placementContent = [
      collegeDatabase.placements.description,
      ...collegeDatabase.placements.recruiters,
      ...(collegeDatabase.placements.batchStatistics?.map(
        (bs) => `${bs.batch}: Total Companies = ${bs.totalCompanies}${bs.examples ? `, Examples: ${bs.examples.join(', ')}` : ''}`,
      ) || []),
    ].join(' ');

    const relevance = calculateRelevance(placementContent, expandedTerms);
    if (relevance > 0.5) {
      results.push({
        content: placementContent,
        relevance,
        source: 'placements',
        intent: QueryIntent.PLACEMENT,
        metadata: {
          batchStats: collegeDatabase.placements.batchStatistics,
          recruiters: collegeDatabase.placements.recruiters,
        },
      });
    }
  }

  if (intent === QueryIntent.SPORTS || intent === QueryIntent.CONTACT || intent === QueryIntent.GENERAL) {
    const sportsContent = [
      collegeDatabase.sports.description,
      collegeDatabase.sports.director
        ? `Director: ${collegeDatabase.sports.director.name}, ${collegeDatabase.sports.director.title}, Contact: ${collegeDatabase.sports.director.contact.mobile}, Email: ${collegeDatabase.sports.director.contact.email}`
        : '',
      ...collegeDatabase.sports.achievements,
      ...collegeDatabase.sports.facilities,
    ].join(' ');

    const relevance = calculateRelevance(sportsContent, expandedTerms);
    if (relevance > 0.5) {
      results.push({
        content: sportsContent,
        relevance,
        source: 'sports',
        intent: QueryIntent.SPORTS,
        metadata: {
          director: collegeDatabase.sports.director,
          achievements: collegeDatabase.sports.achievements,
        },
      });
    }
  }

  if (intent === QueryIntent.HOSTEL || intent === QueryIntent.FACILITIES || intent === QueryIntent.GENERAL) {
    if (collegeDatabase.hostel) {
      const hostelContent = [
        collegeDatabase.hostel.description,
        collegeDatabase.hostel.supervisors?.boys || '',
        collegeDatabase.hostel.supervisors?.girls || '',
        collegeDatabase.hostel.capacity?.boys || '',
        collegeDatabase.hostel.capacity?.girls || '',
        ...(collegeDatabase.hostel.facilities || []),
      ].join(' ');

      const relevance = calculateRelevance(hostelContent, expandedTerms);
      if (relevance > 0.5) {
        results.push({
          content: hostelContent,
          relevance,
          source: 'hostel',
          intent: QueryIntent.HOSTEL,
          metadata: {
            supervisors: collegeDatabase.hostel.supervisors,
            capacity: collegeDatabase.hostel.capacity,
            facilities: collegeDatabase.hostel.facilities,
          },
        });
      }
    }
  }

  if (intent === QueryIntent.LEADERSHIP || intent === QueryIntent.CONTACT || intent === QueryIntent.GENERAL) {
    if (collegeDatabase.leadership) {
      const leadershipContent = [
        collegeDatabase.leadership.principal
          ? `Principal: ${collegeDatabase.leadership.principal.name}, ${collegeDatabase.leadership.principal.title || ''}`
          : '',
        ...(collegeDatabase.leadership.managingCommittee?.officers?.map((o) => `${o.title}: ${o.name}`) || []),
        ...(collegeDatabase.leadership.managingCommittee?.members || []),
      ].join(' ');

      const relevance = calculateRelevance(leadershipContent, expandedTerms);
      if (relevance > 0.5) {
        results.push({
          content: leadershipContent,
          relevance,
          source: 'leadership',
          intent: QueryIntent.LEADERSHIP,
          metadata: {
            principal: collegeDatabase.leadership.principal,
            committee: collegeDatabase.leadership.managingCommittee,
          },
        });
      }
    }
  }

  if (intent === QueryIntent.DEPARTMENT || intent === QueryIntent.CONTACT || intent === QueryIntent.GENERAL) {
    Object.entries(collegeDatabase.departments).forEach(([deptKey, dept]) => {
      const deptContent = [
        dept.name,
        dept.description,
        dept.head ? `Head: ${dept.head.name}, ${dept.head.designation}` : '',
        ...(dept.identifiers || []),
        ...(dept.highlights || []),
        ...dept.faculty.map((f) => `${f.name}, ${f.designation}`),
        ...dept.labs,
        ...(dept.programs || []),
      ].join(' ');

      const relevance = calculateRelevance(deptContent, expandedTerms);
      if (relevance > 0.5) {
        results.push({
          content: deptContent,
          relevance,
          source: `department.${deptKey}`,
          intent: QueryIntent.DEPARTMENT,
          metadata: {
            department: dept,
            key: deptKey,
          },
        });
      }
    });
  }

  if (intent === QueryIntent.ADMISSIONS || intent === QueryIntent.GENERAL) {
    const admissionsContent = [
      collegeDatabase.admissions.process,
      collegeDatabase.admissions.eligibility,
    ].join(' ');

    const relevance = calculateRelevance(admissionsContent, expandedTerms);
    if (relevance > 0.5) {
      results.push({
        content: admissionsContent,
        relevance,
        source: 'admissions',
        intent: QueryIntent.ADMISSIONS,
      });
    }
  }

  const aboutContent = [
    collegeDatabase.about.mission,
    collegeDatabase.about.vision,
    collegeDatabase.about.description,
  ].join(' ');

  const aboutRelevance = calculateRelevance(aboutContent, expandedTerms);
  if (aboutRelevance > 0.5) {
    results.push({
      content: aboutContent,
      relevance: aboutRelevance,
      source: 'about',
      intent: QueryIntent.GENERAL,
    });
  }

  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

// Format search results for AI context
export function formatSearchResultsForAI(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No relevant information found in the college database.";
  }
  
  let formatted = "Relevant Information from College Database:\n\n";
  
  results.forEach((result, index) => {
    formatted += `[Result ${index + 1}] (Source: ${result.source}, Relevance: ${result.relevance.toFixed(2)})\n`;
    formatted += `${result.content.substring(0, 500)}${result.content.length > 500 ? '...' : ''}\n\n`;
  });
  
  return formatted;
}

// Get specific information by intent
export function getInformationByIntent(intent: QueryIntent, specificQuery?: string): string {
  switch (intent) {
    case QueryIntent.PLACEMENT:
      const placementStats = collegeDatabase.placements.batchStatistics;
      let placementInfo = `Placement Overview:\n${collegeDatabase.placements.description}\n\n`;
      
      if (placementStats && placementStats.length > 0) {
        placementInfo += "Batch-wise Statistics:\n";
        placementStats.forEach(bs => {
          placementInfo += `- ${bs.batch}: ${bs.totalCompanies} companies visited\n`;
          if (bs.examples) {
            placementInfo += `  Examples: ${bs.examples.slice(0, 5).join(', ')}\n`;
          }
        });
      }
      
      case QueryIntent.ADMISSIONS:
        return `Admissions at KSSEM:\n${collegeDatabase.admissions.process}\n\nEligibility:\n${collegeDatabase.admissions.eligibility}`;
      case QueryIntent.CULTURAL:
        return `Cultural Life at KSSEM:\n${collegeDatabase.cultural.description}\n\nMajor Events: ${collegeDatabase.cultural.events.slice(0, 5).join(', ')}\nClubs: ${collegeDatabase.cultural.clubs.slice(0, 5).join(', ')}`;
      case QueryIntent.FACILITIES:
        return `Key Facilities:\n- Central Library\n- Modern laboratories across departments\n- Dedicated innovation & research centers\n- Sports complex and gymnasium\n- Hostel blocks with Wi-Fi and study halls`;
      case QueryIntent.DEPARTMENT: {
        if (specificQuery) {
          const target = specificQuery.toLowerCase();
          for (const dept of Object.values(collegeDatabase.departments)) {
            const identifiers = [...(dept.identifiers || []), dept.name.toLowerCase()];
            if (identifiers.some((identifier) => target.includes(identifier.toLowerCase()))) {
              const labSummary = dept.labs.slice(0, 3).join(', ');
              const facultySummary = dept.faculty.slice(0, 3).map((f) => f.name).join(', ');
              return `${dept.name}: ${dept.description}\nKey Labs: ${labSummary}\nFaculty Highlights: ${facultySummary}`;
            }
          }
        }
        return `KSSEM offers departments including ${Object.values(collegeDatabase.departments).map((dept) => dept.name).join(', ')}.`;
      }
      case QueryIntent.CONTACT:
        return 'For general enquiries call +91-80-0000-0000 or email info@kssem.edu.in. Visit the principal office in the main administrative block for official correspondence.';
      case QueryIntent.NAVIGATION:
        return 'Use the kiosk navigation feature to visualize step-by-step directions within KSSEM B-Block. Ask for specific rooms or labs for precise routing.';
      placementInfo += `\nTop Recruiters (sample): ${collegeDatabase.placements.recruiters.slice(0, 15).join(', ')}`;
      return placementInfo;
    
    case QueryIntent.SPORTS:
      const director = collegeDatabase.sports.director;
      let sportsInfo = collegeDatabase.sports.description + '\n\n';
      
      if (director) {
        sportsInfo += `Sports Director: ${director.name}\n`;
        sportsInfo += `Title: ${director.title}\n`;
        sportsInfo += `Qualifications: ${director.qualifications}\n`;
        sportsInfo += `Contact: ${director.contact.mobile}\n`;
        sportsInfo += `Email: ${director.contact.email}\n\n`;
      }
      
      sportsInfo += `Recent Achievements:\n${collegeDatabase.sports.achievements.slice(0, 5).join('\n')}`;
      return sportsInfo;
    
    case QueryIntent.HOSTEL:
      if (!collegeDatabase.hostel) return "Hostel information not available.";
      
      let hostelInfo = "Hostel Facilities at KSSEM:\n\n";
      hostelInfo += `Supervisors:\n`;
      hostelInfo += `- ${collegeDatabase.hostel.supervisors?.boys || 'N/A'}\n`;
      hostelInfo += `- ${collegeDatabase.hostel.supervisors?.girls || 'N/A'}\n\n`;
      hostelInfo += `Capacity:\n`;
      hostelInfo += `- Boys: ${collegeDatabase.hostel.capacity?.boys || 'N/A'}\n`;
      hostelInfo += `- Girls: ${collegeDatabase.hostel.capacity?.girls || 'N/A'}\n\n`;
      hostelInfo += `Key Facilities:\n${(collegeDatabase.hostel.facilities || []).slice(0, 8).map(f => `- ${f}`).join('\n')}`;
      hostelInfo += `\n\n${collegeDatabase.hostel.feesNote || ''}`;
      return hostelInfo;
    
    case QueryIntent.LEADERSHIP:
      if (!collegeDatabase.leadership) return "Leadership information not available.";
      
      let leadershipInfo = "KSSEM Leadership:\n\n";
      if (collegeDatabase.leadership.principal) {
        leadershipInfo += `Principal: ${collegeDatabase.leadership.principal.name}`;
        if (collegeDatabase.leadership.principal.title) {
          leadershipInfo += ` (${collegeDatabase.leadership.principal.title})`;
        }
        leadershipInfo += '\n\n';
      }
      
      if (collegeDatabase.leadership.managingCommittee?.officers) {
        leadershipInfo += "Managing Committee:\n";
        collegeDatabase.leadership.managingCommittee.officers.forEach(officer => {
          leadershipInfo += `- ${officer.title}: ${officer.name}\n`;
        });
      }
      
      return leadershipInfo;
    
    default:
      return collegeDatabase.about.description;
  }
}
