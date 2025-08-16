// Acode AI Assistant: Command Suggester

/**
 * Calculates the Levenshtein distance between two strings.
 * This measures the number of edits (insertions, deletions, substitutions)
 * needed to change one word into the other. A lower number means more similar.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The distance between the two strings.
 */
function levenshtein(a, b) {
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}


// Module configuration
module.exports.config = {
    name: "command_suggester",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Acode AI Assistant",
    description: "Suggests a correct command if the user types an invalid one.",
    commandCategory: "system",
    usages: "",
    cooldowns: 3,
};

// This module uses handleEvent to catch all messages.
module.exports.handleEvent = async function({ api, event }) {
    const { threadID, messageID, body } = event;

    // Do nothing if the message is empty
    if (!body) return;

    // Get the prefix for the current thread/group, or the global prefix
    const prefix = (global.data.threadData.get(threadID) || {}).PREFIX || global.config.PREFIX;

    // This event should only trigger if the message starts with the prefix
    if (!body.startsWith(prefix)) {
        return;
    }

    // Isolate the attempted command name (the first word after the prefix)
    const attemptedCommand = body.slice(prefix.length).trim().split(" ")[0].toLowerCase();
    
    // If there's no command name after the prefix, do nothing.
    if (!attemptedCommand) {
        return;
    }

    // IMPORTANT: Check if the command actually exists. If it does, this module should not interfere.
    // This includes checking command aliases.
    if (global.client.commands.has(attemptedCommand)) {
        return;
    }

    let minDistance = Infinity;
    let bestMatch = '';
    
    // CUSTOMIZATION: How "close" a command needs to be to get suggested.
    // A lower number is stricter. 2 or 3 is usually good.
    const similarityThreshold = 3;

    // Iterate through all available commands to find the best match
    for (const command of global.client.commands.values()) {
        const distance = levenshtein(attemptedCommand, command.config.name);
        
        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = command.config.name;
        }

        // Also check against command aliases
        if (command.config.aliases && command.config.aliases.length > 0) {
            for (const alias of command.config.aliases) {
                const aliasDistance = levenshtein(attemptedCommand, alias);
                if (aliasDistance < minDistance) {
                    minDistance = aliasDistance;
                    bestMatch = alias; // suggest the alias they were close to
                }
            }
        }
    }

    // If we found a reasonably close match, send a suggestion
    if (bestMatch && minDistance <= similarityThreshold) {
        return api.sendMessage(
            `❌ Command "${attemptedCommand}" not found.\n\nDid you mean: "${prefix}${bestMatch}"?`,
            threadID,
            messageID
        );
    }
};

// This command does not need a `run` function as it operates on events.
module.exports.run = async ({}) => {};