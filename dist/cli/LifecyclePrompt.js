"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptForLifecycleSelection = promptForLifecycleSelection;
async function promptForLifecycleSelection(rl, groupNames) {
    if (groupNames.length === 0) {
        return { initGroups: [], endGroups: [] };
    }
    console.log('\nDetected groups/transactions:');
    groupNames.forEach((group, index) => {
        console.log(`  ${index + 1}. ${group}`);
    });
    const lifecycleAnswer = await rl.question('\nSelect lifecycle groups? Press Enter to skip, or type "split" to choose init/end groups: ');
    if (!lifecycleAnswer.trim() || lifecycleAnswer.trim().toLowerCase() === 'skip') {
        return { initGroups: [], endGroups: [] };
    }
    while (true) {
        const initAnswer = await rl.question('Enter init group numbers or names (comma-separated, blank for none): ');
        const initGroups = parseSelections(initAnswer, groupNames);
        const endAnswer = await rl.question('Enter end group numbers or names (comma-separated, blank for none): ');
        const endGroups = parseSelections(endAnswer, groupNames);
        const overlap = endGroups.filter((group) => initGroups.includes(group));
        if (overlap.length > 0) {
            console.log(`\nThe same group cannot be assigned to both init and end: ${overlap.join(', ')}`);
            console.log('Please choose the groups again.\n');
            continue;
        }
        return { initGroups, endGroups };
    }
}
function parseSelections(answer, groupNames) {
    const trimmed = answer.trim();
    if (!trimmed) {
        return [];
    }
    if (trimmed.toLowerCase() === 'all') {
        return [...groupNames];
    }
    const chosen = new Set();
    const tokens = trimmed.split(',').map((token) => token.trim()).filter(Boolean);
    for (const token of tokens) {
        const asNumber = Number(token);
        if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) {
            const group = groupNames[asNumber - 1];
            if (!group) {
                throw new Error(`Invalid group selection index: ${token}`);
            }
            chosen.add(group);
            continue;
        }
        const directMatch = groupNames.find((group) => group === token);
        if (!directMatch) {
            throw new Error(`Unknown group selection: ${token}`);
        }
        chosen.add(directMatch);
    }
    return Array.from(chosen);
}
//# sourceMappingURL=LifecyclePrompt.js.map