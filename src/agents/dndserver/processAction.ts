/**
 * Process action requests with mid-narrative continuation
 */

import { TavernState, CharacterAction, SkillCheckResult, GameActionRequest } from './types.js';
import * as gameEngine from './gameEngine.js';
import { AgentClient } from './agentClient.js';

/**
 * Create a skill check result for logging
 */
export function createSkillCheckResult(
  characterName: string,
  skillCheck: ReturnType<typeof gameEngine.performSkillCheck>
): SkillCheckResult {
  return {
    characterName,
    skillName: skillCheck.skillName,
    rollValue: skillCheck.rolls[0],
    modifier: skillCheck.modifier,
    total: skillCheck.total,
    difficultyClass: skillCheck.dc,
    success: skillCheck.success,
    timestamp: new Date().toISOString(),
    advantage: 'normal' // Would need to be passed from the action request
  };
}

/**
 * Process a single action request
 */
export async function processAction(
  request: GameActionRequest, 
  activeCharacter: string,
  activeAgent: AgentClient,
  modifiedResponse: string,
  currentTavernState: TavernState,
  tavernLog: any,
  characterGoal: string
): Promise<string> {
  try {
    // Extract the action tag and everything before it
    const actionTag = modifiedResponse.match(
      new RegExp(`\\[\\s*ACTION\\s*:\\s*${request.actionType}\\s*.*?\\]`, 'i')
    )?.[0];
    
    if (!actionTag) {
      console.log(`[TavernServer] Could not find action tag for ${request.actionType} in response`);
      return modifiedResponse;
    }
    
    const actionTagIndex = modifiedResponse.indexOf(actionTag);
    if (actionTagIndex < 0) {
      return modifiedResponse;
    }
    
    // Split the response at the action tag
    const responseBeforeAction = modifiedResponse.substring(0, actionTagIndex + actionTag.length);
    const responseAfterAction = modifiedResponse.substring(actionTagIndex + actionTag.length);
    
    // Extract target character and object
    let targetCharacter = null;
    let targetObject = null;
    
    if (request.target) {
      // Check if target is a character
      const targetCharMatch = currentTavernState.characters.find(
        c => c.name.toLowerCase() === request.target?.toLowerCase()
      );
      
      if (targetCharMatch) {
        targetCharacter = targetCharMatch.name;
      } else {
        // Assume it's an object
        targetObject = request.target;
      }
    }
    
    // Resolve the action using the game engine
    const actionResult = gameEngine.resolveAction(
      activeCharacter,
      request.actionType,
      targetCharacter,
      targetObject,
      currentTavernState
    );
    
    // Format the skill check result for logging
    const skillCheckResult = actionResult.skillCheck ? 
      createSkillCheckResult(activeCharacter, actionResult.skillCheck) : 
      undefined;
    
    // Log the action and its result
    const actionDescription = `attempts to ${request.actionType} ${request.target || ''}`;
    const actionLog: CharacterAction = {
      character: activeCharacter,
      action: actionDescription,
      timestamp: new Date().toISOString(),
      target: request.target,
      skillCheck: skillCheckResult,
      success: actionResult.success
    };
    
    // Add to tavern log
    tavernLog.actions.push(actionLog);
    tavernLog.timestamps.push(actionLog.timestamp);
    
    // Update tavern state with the action event
    currentTavernState.events.push({
      description: `${activeCharacter} ${actionDescription} - ${actionResult.success ? 'SUCCESS' : 'FAILURE'}`,
      timestamp: new Date().toISOString()
    });
    
    // Format the dice roll result
    const diceResults = actionResult.skillCheck ? 
      `🎲 ${actionResult.skillCheck.skillName} check: [${actionResult.skillCheck.rolls[0]}+${actionResult.skillCheck.modifier}=${actionResult.skillCheck.total} vs DC ${actionResult.skillCheck.dc}]` : 
      '';
    
    // Create the outcome text that will be inserted into the narrative
    const outcomeText = `\n\n${diceResults}\n**${actionResult.success ? 'SUCCESS' : 'FAILURE'}**: ${actionResult.outcome}\n\n`;
    
    // Apply any state updates from the action
    if (actionResult.stateUpdates) {
      Object.assign(currentTavernState, actionResult.stateUpdates);
    }
    
    // Keep metadata management
    if (!currentTavernState.metadata) {
      currentTavernState.metadata = {};
    }
    
    // Store skill check results in metadata
    if (!currentTavernState.metadata.skillChecks) {
      currentTavernState.metadata.skillChecks = [];
    }
    
    if (skillCheckResult) {
      currentTavernState.metadata.skillChecks.push(skillCheckResult);
      
      // Limit to last 10 skill checks
      if (currentTavernState.metadata.skillChecks.length > 10) {
        currentTavernState.metadata.skillChecks = currentTavernState.metadata.skillChecks.slice(-10);
      }
    }
    
    // Construct a follow-up message to have the character continue based on the outcome
    const followUpContext = `
You performed an action: [${request.actionType} ${request.target || ''}]
Result: ${actionResult.success ? 'SUCCESS' : 'FAILURE'}
Outcome: ${actionResult.outcome}

Now CONTINUE your response from where you left off, reacting to this outcome.
- If you succeeded, describe how you take advantage of that success
- If you failed, describe your reaction and any consequences
- Keep pursuing your goal: ${characterGoal}

IMPORTANT: Do NOT repeat what you wrote before. Start directly with your reaction to the action outcome.
`;
    
    // Get a continuation from the agent
    const continuationResponse = await activeAgent.sendMessage(followUpContext, {
      tavernState: currentTavernState,
      goal: characterGoal,
      continueResponse: true
    });
    
    // Combine everything into the final response:
    // 1. Text before the action
    // 2. The action tag
    // 3. The outcome text
    // 4. The continuation response
    // We're intentionally discarding anything that was after the action tag in the original response
    const finalResponse = responseBeforeAction + outcomeText + continuationResponse;
    
    return finalResponse;
  } catch (actionError) {
    console.error(`[TavernServer] Error processing action ${request.actionType}:`, actionError);
    return modifiedResponse + `\n\n[SYSTEM ERROR: Failed to process action ${request.actionType}: ${actionError.message}]`;
  }
}

export default {
  createSkillCheckResult,
  processAction
};