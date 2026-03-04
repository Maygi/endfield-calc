/**
 * ui.js - Frontend wiring for the combat timeline UI.
 * Imports from actual source modules and drives the HTML interface.
 */

import { Character } from './character/character.js';
import { SkillEvent } from './events/skillevent.js';
import { CHARACTER_TEMPLATES, SCOPE } from './constants/data.js';
import { BuffEffect } from './events/effects/buffeffect.js';
import { SKILL_TYPES } from './character/skill.js';

// Import the shared singleton instances from state.js so all modules
// share the same timeline and enemyStats (main.js re-exports these too).
import { timeline, enemyStats } from './state.js';

// ─── CHARACTERS ──────────────────────────────────────────────────────────────
const LOADED_CHARACTERS = {};
for (const key of Object.keys(CHARACTER_TEMPLATES)) {
    if (key === 'BOSS') continue;
    try {
        const char = new Character(key);
        LOADED_CHARACTERS[key] = char;
    } catch (e) {
        console.warn(`Skipping template ${key}:`, e);
    }
}

console.log('[ui.js] Loaded characters:', Object.keys(LOADED_CHARACTERS));
for (const [key, char] of Object.entries(LOADED_CHARACTERS)) {
    console.log(`  ${key}: name=${char.name}, abilities=`, Object.entries(char.abilities).map(([k,v]) => `${k}:${v?.type ?? 'null'}`).join(', '));
}

// ─── TYPE DISPLAY INFO ───────────────────────────────────────────────────────
const TYPE_INFO = {
    basicAttack:  { label: 'Basic',    cls: 'basic'    },
    battleSkill:  { label: 'Skill',    cls: 'skill'    },
    comboSkill:   { label: 'Combo',    cls: 'combo'    },
    ultimate:     { label: 'Ultimate', cls: 'ultimate' },
    finisher:     { label: 'Finisher', cls: 'finisher' }
};

function typeInfo(type) {
    return TYPE_INFO[type] || { label: type || '?', cls: 'basic' };
}

// Character accent colors
const CHAR_COLORS = {
    electric: '#e040fb',
    heat:     '#ffab40',
    physical: '#90caf9',
    cryo:     '#80deea',
    nature:   '#a5d6a7',
    aether:   '#ce93d8',
};

function charColor(char) {
    return CHAR_COLORS[char.element] || '#4fc3f7';
}

// ─── TIMELINE STATE ───────────────────────────────────────────────────────────
// Maps event UUID → { skillEvent, charKey }
const skillEventMap = new Map();

const PX_PER_SEC = 65;
const TIMELINE_DURATION = 30;

let dragSource = null;
let ctxTargetId = null;
let pendingMoveId = null;

// ─── RENDER: ABILITY PANEL ───────────────────────────────────────────────────
function renderAbilityPanel() {
    const container = document.getElementById('char-list');
    container.innerHTML = '';

    for (const [charKey, char] of Object.entries(LOADED_CHARACTERS)) {
        const color = charColor(char);
        const section = document.createElement('div');
        section.className = 'character-section';

        const hdr = document.createElement('div');
        hdr.className = 'char-header';
        hdr.innerHTML = `<div class="char-dot" style="background:${color}"></div>
                         <div class="char-name">${char.name}</div>`;
        section.appendChild(hdr);

        for (const [abilKey, ability] of Object.entries(char.abilities)) {
            if (!ability) continue;
            const ti = typeInfo(ability.type);
            const item = document.createElement('div');
            item.className = `ability-item type-${ti.cls}`;
            item.draggable = true;
            item.dataset.charKey = charKey;
            item.dataset.abilityKey = abilKey;

            const iconText = (ability.name || abilKey).split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
            item.innerHTML = `
                <div class="ability-icon">${iconText}</div>
                <div class="ability-info">
                    <div class="ability-name">${ability.name}</div>
                    <div class="ability-type">${ti.label} · ${ability.element || char.element || '—'} · ${ability.mv != null ? (ability.mv * 100).toFixed(0) + '% MV' : ''}</div>
                </div>`;

            item.addEventListener('dragstart', e => {
                dragSource = { type: 'ability', charKey, abilityKey: abilKey };
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'copy';
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                dragSource = null;
            });
            section.appendChild(item);
        }
        container.appendChild(section);
    }
}

// ─── RENDER: TIMELINE ────────────────────────────────────────────────────────
function renderTimeline() {
    const inner = document.getElementById('timeline-inner');
    const lanesContainer = document.getElementById('drop-lanes');
    const ruler = document.getElementById('time-ruler');
    const emptyMsg = document.getElementById('empty-msg');

    const scrollEl = document.getElementById('timeline-scroll');
    const minWidth = Math.max(TIMELINE_DURATION * PX_PER_SEC + 100, scrollEl.offsetWidth - 1);
    inner.style.width = minWidth + 'px';

    // Ruler
    ruler.style.width = minWidth + 'px';
    ruler.innerHTML = `<div class="ruler-track"></div>`;
    const tickStep = TIMELINE_DURATION > 20 ? 2 : 1;
    for (let t = 0; t <= TIMELINE_DURATION; t += tickStep) {
        const tick = document.createElement('div');
        tick.className = 'ruler-tick';
        tick.style.left = (24 + t * PX_PER_SEC) + 'px';
        tick.innerHTML = `<div class="ruler-tick-line"></div><div class="ruler-tick-label">${t}s</div>`;
        ruler.appendChild(tick);
    }

    // Lanes — one per character
    lanesContainer.innerHTML = '';
    for (const [charKey, char] of Object.entries(LOADED_CHARACTERS)) {
        const color = charColor(char);
        const lane = document.createElement('div');
        lane.className = 'drop-lane';
        lane.style.width = minWidth + 'px';
        lane.dataset.laneChar = charKey;
        lane.innerHTML = `<span class="lane-label" style="color:${color}88">${char.name}</span>`;
        setupLaneDnD(lane, charKey);
        lanesContainer.appendChild(lane);

        // Render events belonging to this character onto this lane
        for (const [id, { skillEvent, charKey: evCharKey }] of skillEventMap) {
            if (evCharKey !== charKey) continue;
            const ev = skillEvent;
            const ability = ev.skill;
            const ti = typeInfo(ability.type);

            // Total damage across all damage instances
            const totalDmg = ev.calculation
                ? ev.calculation.damageCalculations.reduce((s, dc) => s + dc.totalDamage, 0)
                : 0;

            const eventEl = document.createElement('div');
            eventEl.className = `tl-event tl-type-${ti.cls}`;
            eventEl.style.left = (24 + ev.time * PX_PER_SEC) + 'px';
            eventEl.dataset.eventId = id;

            const iconText = (ability.name || "??").split(/\\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
            eventEl.innerHTML = `
                <div class="tl-event-icon">${iconText}</div>
                <div class="tl-event-info">
                    <div class="tl-event-name">${ability.name}</div>
                    <div class="tl-event-dmg">${Math.round(totalDmg).toLocaleString()}</div>
                </div>`;

            eventEl.addEventListener('mouseenter', e => showTooltip(id, e));
            eventEl.addEventListener('mousemove', e => moveTooltip(e));
            eventEl.addEventListener('mouseleave', hideTooltip);
            eventEl.addEventListener('contextmenu', e => {
                e.preventDefault();
                showCtxMenu(id, e.clientX, e.clientY);
            });
            eventEl.draggable = true;
            eventEl.addEventListener('dragstart', e => {
                dragSource = { type: 'timeline', eventId: id };
                eventEl.classList.add('dragging-tl');
                e.dataTransfer.effectAllowed = 'move';
            });
            eventEl.addEventListener('dragend', () => {
                eventEl.classList.remove('dragging-tl');
                dragSource = null;
            });

            lane.appendChild(eventEl);
        }
    }

    emptyMsg.classList.toggle('visible', skillEventMap.size === 0);
    updateStatusBar();
}

// ─── DRAG & DROP LANE SETUP ──────────────────────────────────────────────────
function setupLaneDnD(lane, charKey) {
    lane.addEventListener('dragover', e => {
        e.preventDefault();
        lane.classList.add('drag-over');

        let ghost = lane.querySelector('.drop-ghost');
        if (!ghost) {
            ghost = document.createElement('div');
            ghost.className = 'drop-ghost';
            ghost.innerHTML = `<span class="drop-ghost-label">DROP</span>`;
            lane.appendChild(ghost);
        }
        const rect = lane.getBoundingClientRect();
        const scrollLeft = document.getElementById('timeline-scroll').scrollLeft;
        const x = e.clientX - rect.left + scrollLeft;
        const t = Math.max(0.5, Math.round(((x - 24) / PX_PER_SEC) * 2) / 2);
        ghost.style.left = (24 + t * PX_PER_SEC) + 'px';
        ghost.classList.add('visible');
    });

    lane.addEventListener('dragleave', e => {
        if (!lane.contains(e.relatedTarget)) {
            lane.classList.remove('drag-over');
            const ghost = lane.querySelector('.drop-ghost');
            if (ghost) ghost.classList.remove('visible');
        }
    });

    lane.addEventListener('drop', e => {
        e.preventDefault();
        lane.classList.remove('drag-over');
        const ghost = lane.querySelector('.drop-ghost');
        if (ghost) ghost.classList.remove('visible');

        const rect = lane.getBoundingClientRect();
        const scrollLeft = document.getElementById('timeline-scroll').scrollLeft;
        const x = e.clientX - rect.left + scrollLeft;
        const t = Math.max(0.5, Math.round(((x - 24) / PX_PER_SEC) * 2) / 2);

        if (!dragSource) return;

        if (dragSource.type === 'ability') {
            // Only allow dropping onto the matching character's lane
            if (dragSource.charKey !== charKey) return;
            const char = LOADED_CHARACTERS[charKey];
            const ability = char.abilities[dragSource.abilityKey];
            if (!ability) return;
            addEvent(charKey, ability, t);
        } else if (dragSource.type === 'timeline') {
            const entry = skillEventMap.get(dragSource.eventId);
            if (!entry || entry.charKey !== charKey) return;
            moveEvent(dragSource.eventId, t);
        }

        dragSource = null;
        renderTimeline();
    });
}

// ─── EVENT MANAGEMENT ────────────────────────────────────────────────────────
function addEvent(charKey, ability, time) {
    const skillEvent = new SkillEvent(time, ability);
    skillEventMap.set(skillEvent.id, { skillEvent, charKey });
    timeline.addEvent(skillEvent);
    renderTimeline();
}

function removeEvent(id) {
    const entry = skillEventMap.get(id);
    if (!entry) return;
    // Remove from timeline by filtering its internal array
    timeline.events = timeline.events.filter(e => e.id !== id);
    // Recalculate remaining events
    for (const ev of timeline.events) {
        ev.recalculate({ time: 0 });
    }
    skillEventMap.delete(id);
    renderTimeline();
}

function moveEvent(id, newTime) {
    const entry = skillEventMap.get(id);
    if (!entry) return;
    timeline.moveEvent(id, newTime);
    renderTimeline();
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function pct(v) { return (v * 100).toFixed(1) + '%'; }
function fmt(v, d = 2) { return (+v).toFixed(d); }

function buildTooltipHTML(id) {
    const entry = skillEventMap.get(id);
    if (!entry) return '';

    const { skillEvent: ev } = entry;
    const ability = ev.skill;
    const calc = ev.calculation;
    const ti = typeInfo(ability.type);
    const typeColors = { basic: '#69f0ae', skill: '#4fc3f7', combo: '#ffab40', ultimate: '#e040fb', finisher: '#ff5252' };
    const col = typeColors[ti.cls] || '#4fc3f7';

    const totalDmg = calc
        ? calc.damageCalculations.reduce((s, dc) => s + dc.totalDamage, 0)
        : 0;

    const iconText = ability.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

    let html = `
    ${ability.name}
            <div class="tt-icon" style="background:${col}18;color:${col}">${iconText}</div>
            <div class="tt-title">
                <div class="tt-meta">${ability.owner?.name || '?'} · ${ti.label} · ${ability.element} · ${(ability.mv * 100).toFixed(0)}% MV · t=${ev.time}s</div>
            </div>
            <div class="tt-total-dmg" style="color:${col}">${Math.round(totalDmg).toLocaleString()}</div>
        </div>`;

    // ── Active effects ──
    if (calc) {
        const buffs = calc.buffEffectsSource || [];
        const debuffs = calc.debuffEffectsSource || [];
        html += `<div class="tt-section">
            <div class="tt-section-label">Active Effects</div>
            <div class="tt-buffs">`;

        if (buffs.length === 0 && debuffs.length === 0) {
            html += `<span class="tt-buff-tag no-buff">No active effects</span>`;
        }
        buffs.forEach(inst => {
            const d = inst.definition;
            const valStr = Math.abs(d.value) < 1 ? `+${pct(d.value)}` : `+${d.value}`;
            html += `<span class="tt-buff-tag" title="${inst.owner?.name || ''}">${d.name} ${valStr}</span>`;
        });
        debuffs.forEach(inst => {
            const d = inst.definition;
            const valStr = Math.abs(d.value) < 1 ? `${pct(d.value)}` : `${d.value}`;
            html += `<span class="tt-buff-tag debuff" title="${inst.owner?.name || ''}">${d.name} ${valStr}</span>`;
        });
        html += `</div></div>`;
    }

    // ── Per-damage-instance breakdown ──
    if (calc && calc.damageCalculations.length > 0) {
        html += `<div class="tt-section"><div class="tt-section-label">Damage Instances</div>`;

        calc.damageCalculations.forEach(dc => {
            const b = dc.breakdown;
            const instDmg = Math.round(dc.totalDamage).toLocaleString();
            const dcTi = typeInfo(dc.skill.type);
            const dcCol = typeColors[dcTi.cls] || col;

            html += `
            <div class="tt-calc-block">
                <div class="tt-calc-title">
                    <span>${dc.skill.name} <span style="color:${dcCol};font-size:10px">${dcTi.label}</span></span>
                    <span class="tt-calc-dmg" style="color:${dcCol}">${instDmg}</span>
                </div>
                <div class="tt-breakdown">
                    <div class="tt-row"><span class="tt-row-label">Skill MV</span><span class="tt-row-value">${(b.skillMv * 100).toFixed(0)}%</span></div>
                    <div class="tt-row"><span class="tt-row-label">Base ATK</span><span class="tt-row-value">${fmt(b.attack)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">ATK%</span><span class="tt-row-value">${pct(b.attackPerc)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Flat ATK</span><span class="tt-row-value">${fmt(b.attackFlat)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Attr Bonus</span><span class="tt-row-value highlight">${pct(b.attrBonus)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Total ATK</span><span class="tt-row-value highlight">${fmt(b.vectorAttack)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">DMG Bonus</span><span class="tt-row-value warn">${pct(b.dmgBonus - 1)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">DMG AMP</span><span class="tt-row-value warn">${pct(b.dmgAmp - 1)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Crit Rate</span><span class="tt-row-value">${pct(b.critRate)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Crit DMG</span><span class="tt-row-value">${pct(b.critDmg)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Crit Multi</span><span class="tt-row-value highlight">${fmt(b.critMultiplier, 3)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Finisher</span><span class="tt-row-value">${b.finisherModifier}×</span></div>
                    <div class="tt-row"><span class="tt-row-label">DMG Taken</span><span class="tt-row-value warn">+${pct(b.dmgTakenModifier - 1)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Resistance</span><span class="tt-row-value">${pct(1 - b.resistanceModifier)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Susceptibility</span><span class="tt-row-value">${pct(b.susceptibilityModifier - 1)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Defense</span><span class="tt-row-value">${fmt(b.defenseModifier, 3)}</span></div>
                    <div class="tt-row"><span class="tt-row-label">Stagger</span><span class="tt-row-value">${dc.staggered ? '+30%' : '—'}</span></div>
                </div>
                <div class="tt-formula">
                    ${(b.skillMv * 100).toFixed(0)}% × <span>${fmt(b.vectorAttack)}</span> × <span>${fmt(b.dmgBonus, 3)}</span> × <span>${fmt(b.dmgAmp, 3)}</span> × <span>${fmt(b.critMultiplier, 3)}</span> × ${b.finisherModifier} × <span>${fmt(b.dmgTakenModifier, 3)}</span> × <span>${fmt(b.resistanceModifier, 3)}</span> × <span>${fmt(b.defenseModifier, 3)}</span> = <span>${instDmg}</span>
                </div>
            </div>`;
        });
        html += `</div>`;
    }

    return html;
}

function showTooltip(id, e) {
    const tt = document.getElementById('tooltip');
    tt.innerHTML = buildTooltipHTML(id);
    tt.classList.add('visible');
    moveTooltip(e);
}

function moveTooltip(e) {
    const tt = document.getElementById('tooltip');
    const pad = 14;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    const w = tt.offsetWidth, h = tt.offsetHeight;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - pad;
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
}

function hideTooltip() {
    document.getElementById('tooltip').classList.remove('visible');
}

// ─── CONTEXT MENU ────────────────────────────────────────────────────────────
function showCtxMenu(id, x, y) {
    ctxTargetId = id;
    const menu = document.getElementById('ctx-menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('visible');
}

function closeCtxMenu() {
    document.getElementById('ctx-menu').classList.remove('visible');
    ctxTargetId = null;
}

function ctxRemoveEvent() {
    if (ctxTargetId) removeEvent(ctxTargetId);
    closeCtxMenu();
}

function ctxMoveEvent() {
    if (!ctxTargetId) return closeCtxMenu();
    const entry = skillEventMap.get(ctxTargetId);
    if (entry) {
        pendingMoveId = ctxTargetId;
        document.getElementById('time-input').value = entry.skillEvent.time;
        const popup = document.getElementById('time-popup');
        popup.style.left = '50%';
        popup.style.top = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.classList.add('visible');
    }
    closeCtxMenu();
}

function confirmTimeEdit() {
    if (pendingMoveId) {
        const newTime = parseFloat(document.getElementById('time-input').value);
        if (!isNaN(newTime) && newTime >= 0) moveEvent(pendingMoveId, newTime);
    }
    closeTimePopup();
}

function closeTimePopup() {
    const popup = document.getElementById('time-popup');
    popup.classList.remove('visible');
    popup.style.transform = '';
    pendingMoveId = null;
}

function clearTimeline() {
    skillEventMap.clear();
    timeline.events = [];
    renderTimeline();
}

// ─── STATUS BAR ──────────────────────────────────────────────────────────────
function updateStatusBar() {
    const totalDmg = [...skillEventMap.values()]
        .reduce((s, { skillEvent }) => {
            if (!skillEvent.calculation) return s;
            return s + skillEvent.calculation.damageCalculations.reduce((ss, dc) => ss + dc.totalDamage, 0);
        }, 0);

    const maxT = skillEventMap.size
        ? Math.max(...[...skillEventMap.values()].map(e => e.skillEvent.time))
        : 0;

    document.getElementById('total-dmg-stat').textContent = `TOTAL: ${Math.round(totalDmg).toLocaleString()}`;
    document.getElementById('event-count-stat').textContent = `${skillEventMap.size} EVENTS`;
    document.getElementById('sb-events').textContent = skillEventMap.size;
    document.getElementById('sb-dmg').textContent = Math.round(totalDmg).toLocaleString();
    document.getElementById('sb-length').textContent = maxT.toFixed(1) + 's';
    document.getElementById('enemy-def').textContent = enemyStats.def;
    document.getElementById('enemy-hp').textContent = enemyStats.hp.toLocaleString();
}

// ─── HORIZONTAL SCROLL ───────────────────────────────────────────────────────
function setupHorizontalScroll() {
    const scrollEl = document.getElementById('timeline-scroll');
    scrollEl.addEventListener('wheel', e => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            e.preventDefault();
            scrollEl.scrollLeft += e.deltaY;
        }
    }, { passive: false });
}

// ─── GLOBAL EVENTS ───────────────────────────────────────────────────────────
document.addEventListener('click', e => {
    if (!document.getElementById('ctx-menu').contains(e.target)) closeCtxMenu();
    if (!document.getElementById('time-popup').contains(e.target)) closeTimePopup();
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeCtxMenu(); closeTimePopup(); hideTooltip(); }
});

document.getElementById('time-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmTimeEdit();
});

document.getElementById('btn-clear').addEventListener('click', clearTimeline);
document.getElementById('ctx-remove').addEventListener('click', ctxRemoveEvent);
document.getElementById('ctx-move').addEventListener('click', ctxMoveEvent);
document.getElementById('btn-confirm-time').addEventListener('click', confirmTimeEdit);
document.getElementById('btn-cancel-time').addEventListener('click', closeTimePopup);

// ─── INIT ────────────────────────────────────────────────────────────────────
setupHorizontalScroll();
renderAbilityPanel();
renderTimeline();