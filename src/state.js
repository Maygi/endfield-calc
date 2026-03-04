/**
 * state.js — Shared singleton instances.
 * Imported by both main.js and ui.js to avoid circular dependencies.
 * skillevent.js and calculation.js import { timeline, enemyStats } from './main.js',
 * which re-exports from here.
 */

import { Timeline } from './timeline/timeline.js';
import { Stats } from './character/stats.js';
import { CHARACTER_TEMPLATES } from './constants/data.js';

export const timeline = new Timeline();

export const enemyStats = new Stats(); enemyStats.applyTemplate(CHARACTER_TEMPLATES.BOSS.baseStats);