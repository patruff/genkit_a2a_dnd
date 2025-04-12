// Types for the DnD tavern server

// Tavern character
export interface TavernCharacter {
  name: string;
  type: string;
  description: string;
  status: string;
}

// Tavern object
export interface TavernObject {
  name: string;
  description: string;
}

// Tavern event
export interface TavernEvent {
  description: string;
  timestamp: string;
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
    [key: string]: any;
  };
}

// Character action
export interface CharacterAction {
  character: string;
  action: string;
  timestamp: string;
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
