/**
 * D&D Game Engine for handling character actions, skill checks, and dice rolls
 */

import { TavernState, CharacterAction } from './types.js';

// Character stats mapping
interface CharacterStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Base character data
const CHARACTER_DATA = {
  'Homie': {
    stats: {
      strength: 8,
      dexterity: 16,
      constitution: 10,
      intelligence: 14,
      wisdom: 12,
      charisma: 15
    },
    skills: {
      'Stealth': { ability: 'dexterity', proficiency: 3 },
      'Sleight of Hand': { ability: 'dexterity', proficiency: 3 },
      'Lockpicking': { ability: 'dexterity', proficiency: 3 },
      'Deception': { ability: 'charisma', proficiency: 2 },
      'Acrobatics': { ability: 'dexterity', proficiency: 2 },
      'Perception': { ability: 'wisdom', proficiency: 1 }
    }
  },
  'Bob': {
    stats: {
      strength: 12,
      dexterity: 10,
      constitution: 14,
      intelligence: 11,
      wisdom: 13,
      charisma: 15
    },
    skills: {
      'Perception': { ability: 'wisdom', proficiency: 2 },
      'Insight': { ability: 'wisdom', proficiency: 2 },
      'Persuasion': { ability: 'charisma', proficiency: 2 },
      'Intimidation': { ability: 'charisma', proficiency: 1 },
      'Athletics': { ability: 'strength', proficiency: 1 }
    }
  }
};

// Calculate ability modifier from stat
function getAbilityModifier(stat: number): number {
  return Math.floor((stat - 10) / 2);
}

// Roll dice with advantage/disadvantage support
export function rollDice(sides: number = 20, rolls: number = 1, advantage: 'advantage' | 'disadvantage' | 'normal' = 'normal'): number[] {
  const results: number[] = [];
  
  for (let i = 0; i < rolls; i++) {
    results.push(Math.floor(Math.random() * sides) + 1);
  }
  
  if (advantage === 'advantage' && rolls === 2) {
    return [Math.max(results[0], results[1])];
  } else if (advantage === 'disadvantage' && rolls === 2) {
    return [Math.min(results[0], results[1])];
  }
  
  return results;
}

// Calculate difficulty class (DC) based on action difficulty
export function calculateDC(difficulty: 'easy' | 'medium' | 'hard' | 'very hard'): number {
  switch (difficulty) {
    case 'easy': return 10;
    case 'medium': return 15;
    case 'hard': return 20;
    case 'very hard': return 25;
    default: return 15;
  }
}

/**
 * Resolve a skill check
 * @param characterName Character performing the check
 * @param skill Skill to check
 * @param difficulty Difficulty of the check
 * @param advantage Advantage, disadvantage, or normal roll
 * @returns Object with roll details and success/failure
 */
export function performSkillCheck(
  characterName: string, 
  skill: string, 
  difficulty: 'easy' | 'medium' | 'hard' | 'very hard' = 'medium',
  advantage: 'advantage' | 'disadvantage' | 'normal' = 'normal'
): {
  rolls: number[],
  modifier: number,
  total: number,
  dc: number,
  success: boolean,
  skillName: string,
  characterName: string
} {
  const character = CHARACTER_DATA[characterName];
  if (!character) {
    throw new Error(`Character ${characterName} not found`);
  }
  
  // Get skill information
  const skillInfo = character.skills[skill];
  if (!skillInfo) {
    throw new Error(`Skill ${skill} not found for character ${characterName}`);
  }
  
  // Get ability modifier and proficiency
  const abilityModifier = getAbilityModifier(character.stats[skillInfo.ability]);
  const proficiencyBonus = skillInfo.proficiency;
  const totalModifier = abilityModifier + proficiencyBonus;
  
  // Calculate DC
  const dc = calculateDC(difficulty);
  
  // Roll dice
  const rollCount = (advantage === 'normal') ? 1 : 2;
  const rolls = rollDice(20, rollCount, advantage);
  
  // Calculate total and determine success
  const effectiveRoll = rolls[0]; // Already adjusted for advantage/disadvantage
  const total = effectiveRoll + totalModifier;
  const success = total >= dc;
  
  return {
    rolls,
    modifier: totalModifier,
    total,
    dc,
    success,
    skillName: skill,
    characterName
  };
}

/**
 * Process an action request from a character
 * @param characterName Character performing the action
 * @param action Action to perform
 * @param targetName Target of the action (if any)
 * @param tavernState Current tavern state
 * @returns Action outcome
 */
export function resolveAction(
  characterName: string,
  action: string,
  targetName: string | null,
  targetObject: string | null,
  tavernState: TavernState
): {
  outcome: string,
  success: boolean,
  skillCheck?: ReturnType<typeof performSkillCheck>,
  stateUpdates?: Partial<TavernState>
} {
  // Normalize the action to lower case
  const actionLower = action.toLowerCase();
  
  // Determine the appropriate skill and difficulty based on the action
  let skill = '';
  let difficulty: 'easy' | 'medium' | 'hard' | 'very hard' = 'medium';
  let advantage: 'advantage' | 'disadvantage' | 'normal' = 'normal';
  
  // Action parsing logic
  if (actionLower.includes('steal') || actionLower.includes('swipe') || actionLower.includes('pickpocket')) {
    skill = 'Sleight of Hand';
    difficulty = 'medium';
    
    // Check if target is watching or suspicious
    if (targetName === 'Bob' && hasBobDetectedTheft(tavernState)) {
      difficulty = 'hard';
      advantage = 'disadvantage';
    }
  } else if (actionLower.includes('hide') || actionLower.includes('sneak')) {
    skill = 'Stealth';
    difficulty = 'medium';
  } else if (actionLower.includes('detect') || actionLower.includes('notice') || actionLower.includes('spot')) {
    skill = 'Perception';
    difficulty = 'medium';
  } else if (actionLower.includes('lie') || actionLower.includes('deceive') || actionLower.includes('bluff')) {
    skill = 'Deception';
    difficulty = 'medium';
  } else if (actionLower.includes('convince') || actionLower.includes('persuade')) {
    skill = 'Persuasion';
    difficulty = 'medium';
  } else if (actionLower.includes('intimidate') || actionLower.includes('threaten')) {
    skill = 'Intimidation';
    difficulty = 'medium';
  } else if (actionLower.includes('unlock') || actionLower.includes('lockpick')) {
    skill = 'Lockpicking';
    difficulty = 'medium';
  } else if (actionLower.includes('jump') || actionLower.includes('flip') || actionLower.includes('tumble')) {
    skill = 'Acrobatics';
    difficulty = 'medium';
  } else if (actionLower.includes('insight') || actionLower.includes('read')) {
    skill = 'Insight';
    difficulty = 'medium';
  } else {
    // Default to a relevant skill based on character
    skill = characterName === 'Homie' ? 'Sleight of Hand' : 'Perception';
    difficulty = 'medium';
  }
  
  // Adjust difficulty based on specific objects
  if (targetObject) {
    const targetObjLower = targetObject.toLowerCase();
    
    if (targetObjLower.includes('gem') || targetObjLower.includes('valuable') || targetObjLower.includes('jewel')) {
      difficulty = 'hard';
    } else if (targetObjLower.includes('locked') || targetObjLower.includes('case') || targetObjLower.includes('box')) {
      difficulty = 'hard';
    }
  }
  
  // Perform the skill check
  const skillCheck = performSkillCheck(characterName, skill, difficulty, advantage);
  
  // Determine the outcome based on the skill check
  let outcome = '';
  let success = skillCheck.success;
  let stateUpdates = {};
  
  if (success) {
    // Successful outcomes based on action type
    if (actionLower.includes('steal') || actionLower.includes('swipe') || actionLower.includes('pickpocket')) {
      if (targetObject) {
        outcome = `${characterName} successfully steals the ${targetObject}!`;
        
        // Update state - transfer object to character
        // This logic would need to be expanded for real gameplay
        stateUpdates = {
          events: [
            ...tavernState.events,
            {
              description: `${characterName} stole the ${targetObject}`,
              timestamp: new Date().toISOString()
            }
          ]
        };
      } else if (targetName) {
        outcome = `${characterName} successfully steals something from ${targetName}!`;
      } else {
        outcome = `${characterName} successfully steals something from the tavern!`;
      }
    } else if (actionLower.includes('hide') || actionLower.includes('sneak')) {
      outcome = `${characterName} successfully hides or sneaks around undetected!`;
    } else if (actionLower.includes('detect') || actionLower.includes('notice')) {
      outcome = `${characterName} notices something important!`;
    } else {
      outcome = `${characterName} successfully performs the action!`;
    }
  } else {
    // Failed outcomes
    if (actionLower.includes('steal') || actionLower.includes('swipe') || actionLower.includes('pickpocket')) {
      if (targetName) {
        outcome = `${characterName} fails to steal from ${targetName} without being noticed!`;
        
        // Update state - target notices the attempt
        stateUpdates = {
          events: [
            ...tavernState.events,
            {
              description: `${targetName} caught ${characterName} trying to steal`,
              timestamp: new Date().toISOString()
            }
          ]
        };
      } else {
        outcome = `${characterName} fumbles the theft attempt!`;
      }
    } else if (actionLower.includes('hide') || actionLower.includes('sneak')) {
      outcome = `${characterName} fails to hide effectively and is spotted!`;
    } else if (actionLower.includes('detect') || actionLower.includes('notice')) {
      outcome = `${characterName} fails to notice anything unusual.`;
    } else {
      outcome = `${characterName} fails to perform the action successfully.`;
    }
  }
  
  return {
    outcome,
    success,
    skillCheck,
    stateUpdates
  };
}

// Helper function to determine if Bob has detected Homie's theft attempts
function hasBobDetectedTheft(tavernState: TavernState): boolean {
  // Check recent events for Bob detecting theft
  const recentEvents = tavernState.events.slice(-5);
  return recentEvents.some(event => 
    event.description.toLowerCase().includes('bob') && 
    event.description.toLowerCase().includes('suspicious')
  );
}

/**
 * Combat encounter between characters
 */
export function resolveCombatAction(attacker: string, defender: string, actionType: 'attack' | 'grapple' | 'disarm'): {
  outcome: string,
  success: boolean,
  attackRoll?: number,
  damageRoll?: number
} {
  // This would be expanded for a real game with actual combat mechanics
  const attackRoll = rollDice(20)[0] + 4; // Simplified attack bonus
  const defenseValue = 12; // Simplified AC/defense
  
  const success = attackRoll >= defenseValue;
  let outcome = '';
  
  if (success) {
    const damage = rollDice(6)[0] + 2; // Simplified damage calculation
    outcome = `${attacker} successfully ${actionType}s ${defender} for ${damage} damage!`;
    return {
      outcome,
      success,
      attackRoll,
      damageRoll: damage
    };
  } else {
    outcome = `${attacker} tries to ${actionType} ${defender} but misses!`;
    return {
      outcome,
      success,
      attackRoll
    };
  }
}

export default {
  rollDice,
  calculateDC,
  performSkillCheck,
  resolveAction,
  resolveCombatAction
};