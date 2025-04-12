# JavaScript Samples

The provided samples are built using [Genkit](https://genkit.dev/) using the Gemini API.

## Agents

- [Movie Agent](src/agents/movie-agent/README.md): Uses TMDB API to search for movie information and answer questions.
- [Coder Agent](src/agents/coder/README.md): Generates full code files as artifacts.
- [D&D Tavern System](src/agents/dndserver/README.md): Interactive D&D tavern with agent characters that can perform actions with real dice rolls and outcomes.

## Testing the Agents

First, follow the instructions in the agent's README file, then run `npx tsx ./cli.ts` to start up a command-line client to talk to the agents. Example:

```bash
export GOOGLE_API_KEY=<your_api_key>
npm run agents:coder

# in a separate terminal
npm run a2a:cli
```

## D&D Action System

The D&D Tavern implements a full action-based system where characters can perform actions with real mechanical outcomes determined by code, not just text descriptions.

### Key Features

- **Real Dice Rolls**: Actions use actual randomized dice rolls with proper D&D mechanics
- **Character Stats**: Characters have attributes and skills that affect their action outcomes
- **Skill Checks**: System performs skill checks with appropriate modifiers and difficulty classes
- **Mid-Narrative Continuation**: Characters react to action outcomes as part of a continuous narrative
- **Action Consequences**: Failed actions can lead to complications or consequences

### Example Flow

Here's a simplified example of the JSON-RPC flow that happens when a character performs an action:

1. Agent sends a message containing an action tag:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tasks/send",
  "params": {
    "id": "task_123",
    "message": {
      "role": "user",
      "parts": [{ 
        "text": "I approach the bar and casually look for valuable items. [ACTION: PERCEPTION target: \"valuable items\", skill: \"Perception\", difficulty: \"medium\"]" 
      }]
    }
  }
}
```

2. The system processes the action:
   - Extracts the action tag
   - Performs a dice roll
   - Calculates the total with skill modifiers
   - Compares against difficulty class
   - Determines success/failure

3. The system sends a continuation request back to the agent:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/send",
  "params": {
    "id": "task_124",
    "message": {
      "role": "user",
      "parts": [{ 
        "text": "You performed an action: [PERCEPTION target: \"valuable items\"]\nResult: SUCCESS\nOutcome: You notice a gleaming gem on the shelf behind the bar.\n\nNow CONTINUE your response from where you left off, reacting to this outcome." 
      }]
    }
  }
}
```

4. The agent continues its narrative based on the outcome:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "status": {
      "state": "completed",
      "message": {
        "role": "agent",
        "parts": [{ 
          "text": "My eyes widen slightly as I notice the gleaming blue sapphire displayed on the shelf behind the bar. That must be worth a fortune! I'll need to create a distraction if I want to get my hands on it..." 
        }]
      }
    }
  }
}
```

### Integration with A2A Framework

The D&D action system leverages the A2A (Agent-to-Agent) framework to create a rich interactive experience:

1. **Multi-Agent Interaction**: Characters (Homie the thief, Bob the bartender) interact with each other through the A2A protocol
2. **Structured Communication**: Uses JSON-RPC requests/responses for structured communication
3. **State Management**: Maintains shared tavern state that all agents can reference
4. **Autonomous Goal Pursuit**: Each agent has goals and autonomously pursues them through actions
5. **Stateful Context**: The tavern server provides contextual information to agents about recent actions, events, and conversations

To run the D&D tavern system:

```bash
export GOOGLE_API_KEY=<your_api_key>

# Start each component in separate terminals
npm run agents:dnd        # Start the Homie agent (thief)
npm run agents:bob        # Start the Bob agent (bartender)
npm run agents:dndserver  # Start the tavern server

# Run a test scenario
./test_actions.sh
```

The system demonstrates how A2A can be used to create rich, interactive experiences where agents not only communicate but also perform actions with real consequences in a shared environment.

---
**NOTE:** 
This is sample code and not production-quality libraries.
---