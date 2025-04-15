# Agent Cards

This folder contains configuration files for D&D fantasy agent templates. Each agent card defines the properties of a D&D character agent that can be generated using the agent generator script.

## What is an Agent Card?

An agent card is a JSON file that defines the properties, abilities, and characteristics of a D&D character agent. These cards are used by the agent generator script to create new agent implementations.

## Agent Card Structure

Agent cards should follow this structure:

```json
{
  "agent_id": "unique_id",
  "character": {
    "name": "Character Name",
    "race": "Human/Gnome/Elf/etc.",
    "class": "Fighter/Wizard/Thief/etc.",
    "level": 5,
    "personality": "brave and bold",
    "speech_style": "confident and direct",
    "description": "A D&D character agent - Details about this character...",
    "port": 41249,
    "appearance": "Description of how the character looks...",
    "initial_action": "Character's initial action when user engages with them",
    "fail_action": "Character's action when something goes wrong",
    "error_action": "Character's action when an error occurs",
    "action_example": "Example of character performing an action",
    "main_skill": "Character's primary skill",
    "action_1": "PRIMARY_ACTION",
    "action_2": "SECONDARY_ACTION",
    "action_3": "TERTIARY_ACTION",
    "default_goal": "Character's default goal",
    "example_prompt": "Example user prompt",
    "example_thought": "Character's internal thought response",
    "example_action_description": "Description of character's action",
    "example_dialogue": "Example of character's dialogue",
    "example_action": "ACTION_TYPE",
    "example_target": "target of action",
    "skills": [
      "Skill1", "Skill2", "Skill3"
    ],
    "stats": {
      "strength": 10,
      "dexterity": 12,
      "constitution": 14,
      "intelligence": 16,
      "wisdom": 13,
      "charisma": 15
    },
    "behavior": [
      "Behavior pattern 1",
      "Behavior pattern 2",
      "Behavior pattern 3"
    ],
    "skill_modifiers": [
      {"skill": "Skill1", "modifier": "+5"},
      {"skill": "Skill2", "modifier": "+3"}
    ],
    "skills_list": [
      {
        "id": "skill_id",
        "name": "Skill Name",
        "description": "Description of skill",
        "tags": ["tag1", "tag2"],
        "examples": [
          "Example 1",
          "Example 2",
          "Example 3"
        ]
      }
    ]
  }
}
```

## Optional Advanced Properties

You can include these optional properties for more advanced agent behavior:

```json
{
  "character": {
    "imports": "import additional_module from 'module';",
    "special_functions": "// Custom functions for special abilities",
    "action_processing": "// Code for processing character-specific actions",
    "metadata_fields": "// Additional metadata fields",
    "prompt_params": "// Additional parameters for prompt",
    "metadata": {
      "icon": "🧙‍♂️",
      "theme_color": "#FF5733",
      "display_name": "Display Name"
    },
    "special_abilities": [
      {
        "name": "Special Ability Name",
        "description": "What the ability does",
        "usage": "How to use this ability"
      }
    ],
    "default_character": {
      // Default character object to use if none provided
    }
  }
}
```

## Example Agent Cards

See the example agent cards in this folder for the formatting and structure.