/**
 * @file constants.js
 * @description Provides constant values and utility functions for the application, such as faction information.
 * [v1.0.0] Corrected syntax to define and export faction data properly.
 */

// Define the faction map as a constant object.
// This was the source of the original syntax error.
const FACTION_MAP = {
    it_dept: { name: 'IT技术部', color: 'blue' },
    im_dept: { name: '信息管理部', color: 'cyan' },
    pmo_dept: { name: '项目综合管理部', color: 'indigo' },
    dm_dept: { name: '数据管理部', color: 'emerald' },
    strategy_dept: { name: '战略管理部', color: 'amber' },
    logistics_dept: { name: '物流IT部', color: 'orange' },
    aoc_dept: { name: '项目AOC', color: 'rose' },
    '3333_dept': { name: '3333', color: 'purple' },
    // Add a default fallback for any unknown factions
    default: { name: '未知部门', color: 'gray' }
};

/**
 * Retrieves faction information based on its ID.
 * @param {string} factionId - The ID of the faction (e.g., 'it_dept').
 * @returns {{name: string, color: string}} The faction's name and color theme.
 */
export function getFactionInfo(factionId) {
    return FACTION_MAP[factionId] || FACTION_MAP.default;
}
