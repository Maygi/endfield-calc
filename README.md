# endfield-calc
 A dynamic Endfield DPS calculator!

# Contributing
If you somehow found this repo and aren't in my Discord, you should join it [here](https://discord.gg/maygi).

This is a work in progress; the end goal is to an interactive timeline where you can build a rotation and get immediate, live feedback on the damage calculations.

# Events
**SkillEvents** are the main "blocks" of the timeline, containing data for the skill they invoke. This typically includes a **damage** effect and/or an **buff** effect.

SkillEvents are placed on the timeline and evaluate their damage events, and recalculate other events that may be affected. Calculation details are stored in a dedicated **calculation** object, which contain the full "receipt" of the calculation, to be shown on the UI.

# Effects
Effects include **buffs**, **debuffs**, or **dormant** effects, which are effects that proc after a certain condition is fulfilled. Currently, this is limited to a new **SkillEvent** matching the name of its trigger. An example of this is Avywenna's combo, *Thunderlance: Strike*, which sets up a dormant effect (Thunderlance), which is then triggered by *Thunderlance: Interdiction* to proc an additional damage effect. The calculation data of the triggered effect is then attached to the *skill that triggered it*, not the original, though it holds a reference to the original event ID.

# Data
Data is currently contained in the **constants/data** class. May be changed in the future for scalability, but this is where the logic for skill and buff definitions currently resides.

# UI
The **timeline.html** file is a temporary vibecoded frontend that is serviceable proof of concept. 