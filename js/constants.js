const FACTION_DETAILS = {
    it_dept: { name: 'IT技术部', color: 'blue' },
    im_dept: { name: '信息管理部', color: 'cyan' },
    pmo_dept: { name: '项目综合管理部', color: 'indigo' },
    dm_dept: { name: '数据管理部', color: 'emerald' },
    strategy_dept: { name: '战略管理部', color: 'amber' },
    logistics_dept: { name: '物流IT部', color: 'orange' },
    aoc_dept: { name: '项目AOC', color: 'rose' },
    '3333_dept': { name: '3333', color: 'purple' },
    default: { name: '未知部门', color: 'gray' }
};

export function getFactionInfo(factionId) {
    return FACTION_DETAILS[factionId] || FACTION_DETAILS.default;
}
