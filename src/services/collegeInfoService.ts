import { collegeDatabase } from '../data/collegeData';
import { Department, FacultyMember } from '../types';
import { fetchRagContext } from './ragClient';
import { classifyIntent } from './intentService';

interface SearchResult {
  text: string;
  imageUrl?: string;
  imageAlt?: string;
}

function formatDepartmentInfo(dept: Department): string {
  const facultyList = dept.faculty
    .map(f => `${f.name}${f.designation ? ` (${f.designation})` : ''}`)
    .join(', ');

  const labList = dept.labs.join(', ');

  let info = dept.description || `Welcome to the ${dept.name} department.`;

  if (dept.labs.length > 0) {
    info += ` Our key facilities include: ${labList}.`;
  }

  if (dept.faculty.length > 0) {
    info += ` Our faculty includes: ${facultyList}.`;
  }

  if (dept.placements) {
    info += ` Placements: ${dept.placements.description}`;
    if (dept.placements.highestPackage) info += ` Highest Package: ${dept.placements.highestPackage}.`;
    if (dept.placements.averagePackage) info += ` Average Package: ${dept.placements.averagePackage}.`;
  }

  if (dept.achievements && dept.achievements.length > 0) {
    info += ` Key Achievements: ${dept.achievements.join(' ')}`;
  }

  return info;
}

function cleanQuery(query: string): string {
  const lowerQuery = query.toLowerCase();
  const fillerWords = ['tell', 'me', 'about', 'the', 'what', 'is', 'are', 'how', 'where', 'when', 'who', 'which', 'can', 'you', 'please', 'information', 'info', 'details', 'department'];
  let cleaned = lowerQuery;
  for (const filler of fillerWords) {
    cleaned = cleaned.replace(new RegExp(`\\b${filler}\\b`, 'g'), '');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

function score(text: string, query: string): number {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const cleanedQuery = cleanQuery(query);
  let score = 0;

  if (lowerText.includes(cleanedQuery) && cleanedQuery.length > 0) {
    score += 10; // Direct match of cleaned query
  }

  if (lowerText.includes(lowerQuery)) {
    score += 8; // Direct match of original query
  }

  const queryWords = cleanedQuery.split(/\s+/).filter(w => w.length > 2);
  for (const word of queryWords) {
    if (lowerText.includes(word)) {
      score += 2; // Word match
    }
  }

  return score;
}

export async function searchWebsite(query: string): Promise<SearchResult> {
  const lowerQuery = query.toLowerCase();

  console.log(`🔍 Searching for: "${query}"`);

  // Try RAG server first
  try {
    const intent = classifyIntent(query);
    console.log(`🎯 Classified intent: ${intent}`);

    const ragResponse = await fetchRagContext(query, intent, 3);

    if (ragResponse.results && ragResponse.results.length > 0) {
      const topResult = ragResponse.results[0];
      console.log(`✅ RAG found: "${topResult.title}" (score: ${topResult.score})`);

      // Read the full text from the snippet
      if (topResult.fullText) {
        console.log(`📄 Returning RAG result with ${topResult.fullText.length} characters`);
        console.log(`📝 Preview: ${topResult.fullText.substring(0, 100)}...`);
        return {
          text: topResult.fullText,
          imageUrl: topResult.metadata?.imageUrl as string | undefined,
          imageAlt: topResult.title || 'College Information'
        };
      } else {
        console.warn(`⚠️ RAG result has no fullText, falling back to local search`);
      }
    }

    console.log(`⚠️ RAG returned no results, falling back to local search`);
  } catch (error) {
    console.warn(`⚠️ RAG query failed, falling back to local search:`, error);
  }

  // Fallback to local search
  // Clean query once before processing (not per department)
  const cleanedQuery = cleanQuery(query);

  let bestScore = 0;
  let bestResult: SearchResult = {
    text: "I couldn't find specific information about that. Please try rephrasing your question or ask about our departments, faculty, facilities, or admissions."
  };

  try {
    // Search through departments
    for (const [deptKey, dept] of Object.entries(collegeDatabase.departments)) {
      const deptText = [
        dept.name,
        dept.description,
        ...dept.keywords,
        ...dept.faculty.map(f => `${f.name} ${f.designation}`),
        ...dept.labs,
        dept.placements?.description || '',
        ...(dept.placements?.topRecruiters || []),
        ...(dept.achievements || [])
      ].join(' ');

      let currentScore = score(deptText, lowerQuery) * 1.5;

      // Boost score if query matches department name closely
      const deptNameLower = dept.name.toLowerCase();
      if (deptNameLower.includes(lowerQuery)) {
        currentScore += 50; // Very big boost for full query in name
      }

      // Check if cleaned query matches department name or keywords
      if (cleanedQuery && deptNameLower.includes(cleanedQuery)) {
        currentScore += 40; // Big boost for core terms in name
      }

      // Boost for department-specific identifiers (from data)
      const identifiers = dept.identifiers || [];
      for (const identifier of identifiers) {
        if (cleanedQuery.includes(identifier)) {
          currentScore += 35; // Strong boost for identifier match
        }
        if (identifier.toLowerCase() === cleanedQuery) {
          currentScore += 45; // Even stronger for exact match
        }
      }

      // Boost for keyword matches
      for (const keyword of dept.keywords) {
        if (keyword.toLowerCase() === cleanedQuery || keyword.toLowerCase() === lowerQuery) {
          currentScore += 25; // Keyword match
        }
      }

      console.log(`  📌 Dept "${dept.name}" scored: ${currentScore}`);

      if (currentScore > bestScore) {
        bestScore = currentScore;
        bestResult = {
          text: formatDepartmentInfo(dept),
          imageUrl: dept.imageUrl,
          imageAlt: `${dept.name} Department`
        };
      }
    }

    // Search faculty members
    for (const dept of Object.values(collegeDatabase.departments)) {
      for (const faculty of dept.faculty) {
        const facultyText = `${faculty.name} ${faculty.designation}`;
        const currentScore = score(facultyText, lowerQuery) * 1.3;

        if (currentScore > bestScore) {
          bestScore = currentScore;
          console.log(`  👤 Faculty "${faculty.name}" scored: ${currentScore}`);

          let facultyInfo = `${faculty.name}`;
          if (faculty.designation) facultyInfo += ` is a ${faculty.designation}`;
          facultyInfo += ` in the ${dept.name} department.`;

          bestResult = {
            text: facultyInfo,
            imageAlt: faculty.name
          };
        }
      }
    }

    // Search labs
    for (const dept of Object.values(collegeDatabase.departments)) {
      for (const lab of dept.labs) {
        const currentScore = score(lab, lowerQuery) * 1.2;

        if (currentScore > bestScore) {
          bestScore = currentScore;
          console.log(`  🔬 Lab "${lab}" scored: ${currentScore}`);

          bestResult = {
            text: `${lab} is available in the ${dept.name} department.`
          };
        }
      }
    }

    // Check college info sections
    const aboutText = [
      collegeDatabase.about.description,
      collegeDatabase.about.mission,
      collegeDatabase.about.vision,
      ...collegeDatabase.about.keywords
    ].join(' ');

    const aboutScore = score(aboutText, lowerQuery) * 0.9;
    console.log(`  ℹ️  About section scored: ${aboutScore}`);

    if (aboutScore > bestScore) {
      bestScore = aboutScore;
      let resultText = collegeDatabase.about.description;
      if (lowerQuery.includes('mission')) {
        resultText = `Mission: ${collegeDatabase.about.mission}`;
      } else if (lowerQuery.includes('vision')) {
        resultText = `Vision: ${collegeDatabase.about.vision}`;
      }
      bestResult = { text: resultText };
    }

    // Check admissions
    const admissionsText = [
      collegeDatabase.admissions.process,
      collegeDatabase.admissions.eligibility,
      ...collegeDatabase.admissions.keywords
    ].join(' ');

    const admissionsScore = score(admissionsText, lowerQuery) * 0.9;
    console.log(`  📝 Admissions section scored: ${admissionsScore}`);

    if (admissionsScore > bestScore) {
      bestScore = admissionsScore;
      let resultText = collegeDatabase.admissions.process;
      if (lowerQuery.includes('eligibility') || lowerQuery.includes('eligible')) {
        resultText = collegeDatabase.admissions.eligibility;
      }
      bestResult = { text: resultText };
    }

    // Check placements
    const placementsText = [
      collegeDatabase.placements.description,
      ...collegeDatabase.placements.recruiters,
      ...collegeDatabase.placements.keywords
    ].join(' ');

    const placementsScore = score(placementsText, lowerQuery) * 0.9;
    console.log(`  💼 Placements section scored: ${placementsScore}`);

    if (placementsScore > bestScore) {
      bestScore = placementsScore;
      let resultText = collegeDatabase.placements.description;
      if (lowerQuery.includes('company') || lowerQuery.includes('companies') || lowerQuery.includes('recruiter')) {
        resultText += ` Top recruiters include: ${collegeDatabase.placements.recruiters.join(', ')}.`;
      }
      bestResult = { text: resultText };
    }

    // Check sports
    const sportsText = [
      collegeDatabase.sports.description,
      ...collegeDatabase.sports.achievements,
      ...collegeDatabase.sports.facilities,
      ...collegeDatabase.sports.keywords
    ].join(' ');

    const sportsScore = score(sportsText, lowerQuery) * 0.9;
    console.log(`  🏆 Sports section scored: ${sportsScore}`);

    if (sportsScore > bestScore) {
      bestScore = sportsScore;
      let resultText = collegeDatabase.sports.description;

      if (lowerQuery.includes('achievement') || lowerQuery.includes('won') || lowerQuery.includes('prize')) {
        resultText = `Recent Sports Achievements: ${collegeDatabase.sports.achievements.join('. ')}.`;
      } else if (lowerQuery.includes('facility') || lowerQuery.includes('ground') || lowerQuery.includes('court') || lowerQuery.includes('gym')) {
        resultText = `Sports Facilities: ${collegeDatabase.sports.facilities.join(', ')}.`;
      }

      bestResult = { text: resultText };
    }

    // Check cultural
    const culturalText = [
      collegeDatabase.cultural.description,
      ...collegeDatabase.cultural.events,
      ...collegeDatabase.cultural.clubs,
      ...collegeDatabase.cultural.keywords
    ].join(' ');

    const culturalScore = score(culturalText, lowerQuery) * 0.9;
    console.log(`  🎭 Cultural section scored: ${culturalScore}`);

    if (culturalScore > bestScore) {
      bestScore = culturalScore;
      let resultText = collegeDatabase.cultural.description;

      if (lowerQuery.includes('event') || lowerQuery.includes('fest') || lowerQuery.includes('arohana')) {
        resultText = `Cultural Events: ${collegeDatabase.cultural.events.join(', ')}.`;
      } else if (lowerQuery.includes('club') || lowerQuery.includes('activity')) {
        resultText = `Cultural Clubs: ${collegeDatabase.cultural.clubs.join(', ')}.`;
      }

      bestResult = { text: resultText };
    }

  } catch (error) {
    console.error('❌ Error searching:', error);
    return {
      text: "I encountered an error while searching. Please try again or rephrase your question."
    };
  }

  console.log(`✅ Best match score: ${bestScore}, returning: ${bestResult.text.substring(0, 100)}...`);

  return bestResult;
}