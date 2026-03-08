# Documentation

Kat here, to explain the new architecture. Old README is preserved for posterity. This doc can be used as a dev guide too.

## Architecture

What fundamentally changed is the backend simulator. Previously, the simulator was primarily using SkillEvents and computing state changes through them, passing to the timeline. This can be functional once extended to completeness, but in the state I interpreted it would likely need some expensive refactoring. A lot of objects contain too much responsibility, and extending to implement future features might be extremely problematic (e.g. comparing multiple rotations, breaking into individual hit timings). No comment on the UI since frontend is basically AI.

So, I've ported this to what is basically a skeleton game engine, with the intent to track every status on a virtual combat scenario, not encapsulated or coupled to the timeline (user-facing end). It uses an Entity-Component System, and models each party involved in the combat scenario as a unique entity. Details are provided in the other docs.

Also yes I'll split this up later on.

## CombatState and the Engine

As mentioned in the architecture section, the CombatState contains all relevant information about the current state of the simulation. This object is what gets saved to allow for timeline scrubbing, and contains all information required to continue the simulation from that point on. Keep the Combatstate light memory-wise, since we will be making (deep) copies of it often.

The Engine is the object that actually drives time forward in the simulation. All events simulated **must** pass through the Engine. It delegates event handling to the appropriate handlers, and each time is guaranteed to receive a receipt from them that provides all information needed for display and logging. The engine contains broadcast channels for each event type, and for each event the engine executes, it will broadcast to all listeners subscribed to that channel. The frontend UI will only need to communicate with the Engine to display all events and receipts.

**Once again, for emphasis: All packets must pass through the Engine.**

## Entities and Components

Every involved party in the combat scenario being simulated is an Entity. Other than the obvious player-controlled 4 units and enemy, this includes a Global entity that represents any effect or state applied to the battlefield itself (e.g. for domain-type skills or environmental effects). Furthermore, this lets us support summons and multiple enemies/multi-part enemies in the future.

Each entity contains one or more Components. An exhaustive list of Components is given below, accompanied by their function, in no particular order. Note that there is virtually no restriction on what components an Entity can or must contain, other than that they must contain at least one.

- Stats
  - Contains base stats of the entity, as well as any and all stat modifiers.
  - Precomputes and caches the final post-modifier stats for retrieval by the Calculator later.
  - "base" stats are stats after level scaling, passives, trust, gear, etc. is applied, just before all buffs and debuffs.
- Resource
  - Tracks resource values of the entity. For example, Ultimate Energy for Operators, or Stagger for enemies.
- Ability
  - Tracks cooldowns (gcd and icd where relevant), ability-related resources, and enhanced ability trigger conditions.
  - Stores the entity's ID to lookup ability data from the corresponding data file.
  - Processes the user-input skill events on the timeline using the data file, returning events for all effects and hits caused.
  - If skills have a specific trigger condition outside of the component, it must subscribe to the relevant broadcast in the Engine.
- Status
  - Applies and manages all status effects on the entity, timed and infinite.
  - Exceptions: Arts Inflictions and Physical Statuses. These have their dedicated components.
  - Responsible for scheduling events for statuses expiring, damage due to statuses (including DoT effects), and broadcasting to statuses.
- Infliction
  - Responsible for tracking and managing Arts Inflictions applied to the entity.
  - References the `arts.js` data file for the required event to return.
- Physical
  - Responsible for tracking and managing Vulnerability and applying Physical Statuses to the entity.
  - References the `physical.js` data file for the required event to return.
- Trigger (maybe should rename to passives?)
  - For potentials, talents, etc. that are innate to the character, **and** require some other event to occur to proc.
  - Subscribes to the relevant broadcast channels of the Engine to know if things triggered.

## Events

These are the data packets used for communication and simulation. Each event **will** contain the following fields:

- `time`
- `priority`
  - Used to break ties in case of identical times
- `sourceId`, `targetId`
  - The unique identifier of the entities involved in the event
- `data`
  - Contains all information necessary for **all** events of that type. No subfield here should be optional. Use the next field for that.
- `optionalData`
  - See above.
- `tags`
  - Optional. You may consider these to be event subtypes, of a sort. They are used exclusively for trigger condition checks. This futureproofs against extremely specific trigger conditions.
- `metadata`
  - Optional. For logging purposes. Any dev- or user-facing information that should be logged or displayed can be stuffed here.

An exhaustive list of Events is given below, in no particular order, with their (mandatory) data fields in parentheses. As far as possible, do not add new Event types. This makes the trigger Observer pattern harder to manage over time. If possible, categorize under one of the below and tag/type it appropriately.

- Hit (`mv`, `element`, `stagger`)
  - A single damage instance.
  - This is not necessarily a single **ability** instance. Multi-hit abilities should generate multiple HitEvent objects.
- Infliction (`element`)
  - An application of an Arts Infliction to a target.
- Physical (`type`)
  - An attempted application of a Physical Status to a target.
  - This is distinct from applying the status through a ApplyStatusEvent - this is passed to the PhysicalComponent to apply Vulnerability stacks.
- ApplyStatus (`statusId`, `duration`, `value`, `type`, `subtype`)
  - An application of a single status effect to a target.
- EndStatus (`statusId`, `isValid`, `type`, `subtype`)
  - A status expiring on a target. Generated by a StatusComponent when it processes an ApplyStatus event.
  - The isValid flag is modified only by the StatusComponent that generated this event. This allows for purging statuses early or extending their duration.
- StatusTick (`statusId`)
  - Prompts the StatusComponent that some status is about to produce some event.
  - This is for periodic events such as Combustion, which applies a Hit every second. So an example flow for it would be:
    - ApplyStatus (combustion) is sent from the Engine to the StatusComponent
    - StatusComponent returns a EndStatus for this debuff *and* a StatusTick scheduled for exactly 1 second later.
    - After 1 second, the StatusTick is received by the Engine, which passes it to the StatusComponent.
    - The StatusComponent checks if the Combustion is still active, and ensures that it should indeed trigger a tick of damage at this moment.
    - Confirming that it does, the StatusComponent returns a Hit (scheduled for immediate processing) and a StatusTick scheduled for the *next* 1-second tick.
    - This repeats until the StatusComponent determines that the tick is no longer applicable, in which case it simply does not return a StatusTick again.
- Skill (`type`)
  - A skill cast placed by the **user**.
- StateUpdate (`property`, `value`)
  - A request to modify some item in the combat state. Usually resources like SP changes, HP changes, etc.

## Data

Character (and in the future, enemy?) data is stored and read from the `/data` folder. This should contain every piece of information about the operator and their kit - raw stats, individual talents/potentials and their effects, abilities and their scaling, etc.

Every character has their own character.js file, which is re-exported by the index.js registry that every other script pulls from. Reading from this database is most commonly done either at initialization of the entity, or when the AbilityComponent processes a SkillEvent. We do not keep copies in the components for memory concerns.
