// main.js — re-exports shared state so skillevent.js and calculation.js
// can import { timeline, enemyStats } from '../main.js' as before.
export { timeline, enemyStats } from './state.js';
