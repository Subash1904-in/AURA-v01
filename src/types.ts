
export enum AppState {
  IDLE = 'IDLE',
  ACTIVE = 'ACTIVE',
  ADMIN = 'ADMIN',
}

export enum VoiceState {
  LISTENING = 'LISTENING', // User is speaking / waiting for input
  THINKING = 'THINKING',   // Processing (Gemini API)
  SPEAKING = 'SPEAKING',   // TTS playback
  ERROR = 'ERROR',         // Permission denied or Network down
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

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
  head?: {
    name: string;
    designation: string;
    qualifications?: string;
    message?: string;
  };
    faculty: FacultyMember[];
    labs: string[];
    imageUrl: string;
    keywords: string[];
    identifiers?: string[];  // Common abbreviations and alternative names for search matching
  highlights?: string[];
  programs?: string[];
  statistics?: Record<string, string>;
  mous?: { name: string; link?: string }[];
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
        batchStatistics?: { batch: string; totalCompanies: number; examples?: string[] }[];
        keywords: string[];
    },
    sports: {
        description: string;
        director?: { name: string; title: string; qualifications: string; contact: { mobile: string; email: string }; message?: string };
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
    hostel?: {
      description: string;
      supervisors?: { boys?: string; girls?: string };
      capacity?: { boys?: string; girls?: string };
      facilities?: string[];
      feesNote?: string;
    },
    leadership?: {
      principal?: {
        name: string;
        title?: string;
        qualifications?: string;
        message?: string;
        focusAreas?: string[];
        contact?: {
          phone?: string;
          email?: string;
          office?: string;
        };
      };
      managingCommittee?: { officers?: { title: string; name: string }[]; members?: string[] };
    },
    departments: Record<string, Department>;
}

export interface Poster {
  id: number | string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  dataUrl?: string; // For backward compatibility
}
