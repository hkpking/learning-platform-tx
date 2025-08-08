/**
 * @file constants.js
 * @description Defines constant values and shared utility functions for the application.
 * [v1.0.0] Created to centralize faction information.
 */

// Centralized map for all faction-related information.
// This makes it easy to add or modify departments in the future without changing other code.
export const FACTION_MAP = {
    it_dept: { name: 'IT技术部', color: 'blue' },
    im_dept: { name: '信息管理部', color: 'cyan' },
    pmo_dept: { name: '项目综合管理部', color: 'indigo' },
    dm_dept: { name: '数据管理部', color: 'emerald' },
    strategy_dept: { name: '战略管理部', color: 'amber' },
    logistics_dept: { name: '物流IT部', color: 'orange' },
    aoc_dept: { name: '项目AOC', color: 'rose' },
    '3333_dept': { name: '3333', color: 'purple' },
    // Fallback for any unknown factions to prevent errors.
    default: { name: '未知部门', color: 'gray' }
};

/**
 * Gets the information for a specific faction by its ID.
 * @param {string} factionId - The ID of the faction (e.g., 'it_dept').
 * @returns {{name: string, color: string}} The faction's display name and color.
 */
export function getFactionInfo(factionId) {
    return FACTION_MAP[factionId] || FACTION_MAP.default;
}
