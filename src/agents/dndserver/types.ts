// Types for the DnD tavern server

// Tavern character
export interface TavernCharacter {
  name: string;
  type: string;
  description: string;
  status: string;
  inventory?: string[]; // Items the character possesses
}

// Tavern object
export interface TavernObject {
  name: string;
  description: string;
  location?: string; // Where the object is located
  status?: string; // Object status (intact, broken, etc.)
  isStealable?: boolean; // Can the object be stolen
  requiredSkill?: string; // Skill needed to interact with the object
  difficultyClass?: number; // DC for interacting with the object
}

// Tavern event
export interface TavernEvent {
  description: string;
  timestamp: string;
  isPublic?: boolean; // Whether all characters know about this event
}

// The state of the tavern
export interface TavernState {
  name: string;
  time: string;
  atmosphere: string;
  characters: TavernCharacter[];
  objects: TavernObject[];
  events: TavernEvent[];
  lastUpdated: string;
  metadata?: {
    characterGoals?: Record<string, string>;
    characterProgress?: Record<string, number>; // Progress toward goals (0-100)
    skillChecks?: SkillCheckResult[]; // Recent skill check results
    [key: string]: any;
  };
}

// Character action
export interface CharacterAction {
  character: string;
  action: string;
  timestamp: string;
  target?: string; // Target character or object
  skillCheck?: SkillCheckResult; // If the action required a skill check
  success?: boolean; // Whether the action succeeded
}

// Skill check result
export interface SkillCheckResult {
  characterName: string;
  skillName: string;
  rollValue: number;
  modifier: number;
  total: number;
  difficultyClass: number;
  success: boolean;
  timestamp: string;
  advantage?: 'advantage' | 'disadvantage' | 'normal';
}

// Conversation entry
export interface ConversationEntry {
  speaker: string;
  listener: string;
  message: string;
  timestamp: string;
}

// Tavern log
export interface TavernLog {
  conversations: ConversationEntry[];
  actions: CharacterAction[];
  timestamps: string[];
}

// Game action request from character
export interface GameActionRequest {
  actionType: string; // steal, hide, search, etc.
  target?: string; // Target character or object
  skill?: string; // Specific skill to use
  difficulty?: 'easy' | 'medium' | 'hard' | 'very hard';
  advantage?: 'advantage' | 'disadvantage' | 'normal';
}
