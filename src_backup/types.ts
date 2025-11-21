
export enum ConversationState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface MapNode {
  id: string;
  name: string;
  floor: string;
  // FIX: Expanded type to be compatible with MapPolygon['type'] and to include a 'special' type.
  type: 'room' | 'lab' | 'office' | 'utility' | 'corridor' | 'lift' | 'stairs' | 'entrance' | 'building' | 'space' | 'ground' | 'road' | 'special';
  coordinates: { x: number; y: number };
  aliases?: string[];
}

export interface MapEdge {
  source: string;
  target: string;
  weight: number;
}

export interface MapPolygon {
  id: string;
  points: { x: number; y: number }[];
  // FIX: Added 'special' to the type union to match MapNode and support special locations.
  type: 'room' | 'lab' | 'office' | 'utility' | 'corridor' | 'lift' | 'stairs' | 'entrance' | 'building' | 'space' | 'ground' | 'road' | 'special';
  label?: string;
  nodeId?: string; 
  color?: {
    top: string;
    wall: string;
    stroke: string;
  }
}

export interface FloorPlan {
  id: string;
  name: string;
  level: number;
  viewBox: string;
  geometry: MapPolygon[];
}

// --- College Info Types ---
export interface FacultyMember {
    name: string;
    designation: string;
}

export interface Department {
    name: string;
    description: string;
    faculty: FacultyMember[];
    labs: string[];
    imageUrl: string;
    keywords: string[];
    identifiers?: string[];  // Common abbreviations and alternative names for search matching
    placements?: {
        description: string;
        highestPackage?: string;
        averagePackage?: string;
        placementRate?: string;
        topRecruiters?: string[];
    };
    achievements?: string[];
}

export interface CollegeInfo {
    about: {
        mission: string;
        vision: string;
        description: string;
        keywords: string[];
    },
    admissions: {
        process: string;
        eligibility: string;
        keywords: string[];
    },
    placements: {
        description: string;
        recruiters: string[];
        keywords: string[];
    },
    sports: {
        description: string;
        achievements: string[];
        facilities: string[];
        keywords: string[];
    },
    cultural: {
        description: string;
        events: string[];
        clubs: string[];
        keywords: string[];
    },
    departments: Record<string, Department>;
}

export interface Poster {
  id: string;
  dataUrl: string;
}