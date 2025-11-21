export enum QueryIntent {
  GENERAL = 'GENERAL',
  ADMISSIONS = 'ADMISSIONS',
  PLACEMENT = 'PLACEMENT',
  CONTACT = 'CONTACT',
  NAVIGATION = 'NAVIGATION',
  FACILITIES = 'FACILITIES',
  SPORTS = 'SPORTS',
  HOSTEL = 'HOSTEL',
  CULTURAL = 'CULTURAL',
  FACILITY = 'FACILITY',
  LEADERSHIP = 'LEADERSHIP',
  DEPARTMENT = 'DEPARTMENT',
}

const INTENT_SECTION_MAP: Partial<Record<QueryIntent, string>> = {
  [QueryIntent.ADMISSIONS]: 'admissions',
  [QueryIntent.PLACEMENT]: 'placements',
  [QueryIntent.SPORTS]: 'sports',
  [QueryIntent.HOSTEL]: 'hostel',
  [QueryIntent.CULTURAL]: 'cultural',
  [QueryIntent.LEADERSHIP]: 'leadership',
  [QueryIntent.DEPARTMENT]: 'departments',
};

export function intentToSection(intent: QueryIntent): string | undefined {
  return INTENT_SECTION_MAP[intent];
}

export function classifyIntent(query: string): QueryIntent {
  const lowerQuery = query.toLowerCase();

  if (/(placement|job|company|recruiter|package|salary|hired|career)/.test(lowerQuery)) {
    return QueryIntent.PLACEMENT;
  }

  if (/(admission|apply|join|enroll|eligibility|criteria|cutoff)/.test(lowerQuery)) {
    return QueryIntent.ADMISSIONS;
  }

  if (/(contact|phone|email|mobile|call|reach|number|office)/.test(lowerQuery)) {
    return QueryIntent.CONTACT;
  }

  if (/(hostel|accommodation|room|boarding|dorm|mess|food)/.test(lowerQuery)) {
    return QueryIntent.HOSTEL;
  }

  if (/(principal|director|president|secretary|committee|management|chairman)/.test(lowerQuery)) {
    return QueryIntent.LEADERSHIP;
  }

  if (/(sports|game|cricket|football|volleyball|athletics|gym|physical)/.test(lowerQuery)) {
    return QueryIntent.SPORTS;
  }

  if (/(department|cse|ece|aids|civil|mech|faculty|professor|hod|engineering)/.test(lowerQuery)) {
    return QueryIntent.DEPARTMENT;
  }

  if (/(facility|facilities|lab|library|infrastructure|building|classroom)/.test(lowerQuery)) {
    return QueryIntent.FACILITIES;
  }

  if (/(culture|fest|event|club|music|dance)/.test(lowerQuery)) {
    return QueryIntent.CULTURAL;
  }

  if (/(where|location|find|reach|navigate|direction|map|floor|room)/.test(lowerQuery)) {
    return QueryIntent.NAVIGATION;
  }

  return QueryIntent.GENERAL;
}
