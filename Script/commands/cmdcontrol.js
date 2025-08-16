const fs = require('fs');
const path = require('path');
const axios = require('axios'); // Assuming you'll need axios for fluxpro

// --- Bot Configuration ---
const BOT_PREFIX = "!"; // Your bot's default prefix
const COMMANDS_DIR = path.join(__dirname, 'commands');
const DATA_DIR = path.join(__dirname, 'data');
const DISABLED_CMDS_FILE = path.join(DATA_DIR, 'disabledCommands.json');

// --- Global variables for commands and disabled list ---
const globalCommands = {}; // Stores all loaded command modules
let disabledCommands = []; // Stores names of disabled commands

// --- Helper functions for disabled commands file management ---
async function getDisabledCommandsFromFile() {
    try {
        const data = await fs.promises.readFile(DISABLED_CMDS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') { // File does not exist
            await fs.promises.writeFile(DISABLED_CMDS_FILE, '[]', 'utf8'); // Create empty array
            return [];
        }
        console.error("Error reading disabled commands file:", error);
        return []; // Return empty array on other errors
    }
}

async function writeDisabledCommandsToFile(cmds) {
    try {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        await fs.promises.writeFile(DISABLED_CMDS_FILE, JSON.stringify(cmds, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing disabled commands file:", error);
        throw new Error("Failed to save command status.");
    }
}

// --- Command Loading Function ---
function loadCommands() {
    console.log("Loading commands...");
    Object.keys(globalCommands).forEach(key => delete globalCommands[key]); // Clear existing commands cleanly

    const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const commandPath = path.join(COMMANDS_DIR, file);
        try {
            // Clear require cache for hot-reloading commands (useful during development)
            delete require.cache[require.resolve(commandPath)];
            const command = require(commandPath);
            if (command.config && command.config.name && typeof command.run === 'function') {
                globalCommands[command.config.name.toLowerCase()] = command;
                console.log(`- Loaded command: ${command.config.name}`);
            } else {
                console.warn(`- Skipped invalid command file: ${file} (missing config or run function)`);
            }
        } catch (error) {
            console.error(`- Failed to load command ${file}:`, error);
        }
    }
    console.log(`Total commands loaded: ${Object.keys(globalCommands).length}`);
}

// --- Disabled Commands Management ---
async function refreshDisabledCommandsList() {
    console.log("Refreshing disabled commands list...");
    disabledCommands = await getDisabledCommandsFromFile();
    console.log("Current disabled commands:", disabledCommands);
}

// Expose a function globally so it can be called if needed (e.g., by a separate admin panel)
global.refreshDisabledCommandsList = refreshDisabledCommandsList;

// --- Bot Initialization ---
async function startBot() {
    loadCommands(); // Load all command modules
    await refreshDisabledCommandsList(); // Load disabled commands list at startup

    // Mock API object for demonstration. REPLACE THIS WITH YOUR REAL BOT API.
    const api = {
        sendMessage: (message, threadID, messageID) => {
            console.log(`[BOT MESSAGE to ${threadID}] ${JSON.stringify(message)} (replying to ${messageID})`);
            return { messageID: Date.now() }; // Mock a message ID
        },
        setMessageReaction: (emoji, messageID, callback, isReact) => {
            console.log(`[BOT REACTION to ${messageID}] ${emoji} (isReact: ${isReact})`);
            if (callback) callback(null);
        },
        unsendMessage: (messageID) => {
            console.log(`[BOT UN-SEND] ${messageID}`);
            return Promise.resolve();
        },
        // Mock listenMqtt for demonstration purposes
        listenMqtt: (callback) => {
            console.log("Bot is listening for messages...");
            // Simulate an incoming message after a delay
            setTimeout(() => {
                console.log("\n--- Simulating a message: '!fluxpro a beautiful landscape' ---");
                callback(null, {
                    type: "message", body: "!fluxpro a beautiful landscape",
                    threadID: "123456789", messageID: "msg1", senderID: "user1"
                });
            }, 1000);

            setTimeout(() => {
                console.log("\n--- Simulating an admin message: '!cmd disable fluxpro' ---");
                callback(null, {
                    type: "message", body: "!cmd disable fluxpro",
                    threadID: "123456789", messageID: "msg2", senderID: "adminID" // Mock admin ID
                });
            }, 3000);

            setTimeout(() => {
                console.log("\n--- Simulating a message (after disable): '!fluxpro another drawing' ---");
                callback(null, {
                    type: "message", body: "!fluxpro another drawing",
                    threadID: "123456789", messageID: "msg3", senderID: "user2"
                });
            }, 6000);

            setTimeout(() => {
                console.log("\n--- Simulating an admin message: '!cmd enable fluxpro' ---");
                callback(null, {
                    type: "message", body: "!cmd enable fluxpro",
                    threadID: "123456789", messageID: "msg4", senderID: "adminID" // Mock admin ID
                });
            }, 9000);

            setTimeout(() => {
                console.log("\n--- Simulating a message (after re-enable): '!fluxpro a futuristic city' ---");
                callback(null, {
                    type: "message", body: "!fluxpro a futuristic city",
                    threadID: "123456789", messageID: "msg5", senderID: "user3"
                });
            }, 12000);

            setTimeout(() => {
                console.log("\n--- Simulating an admin message: '!cmd list' ---");
                callback(null, {
                    type: "message", body: "!cmd list",
                    threadID: "123456789", messageID: "msg6", senderID: "adminID"
                });
            }, 15000);
        }
    };
    // END Mock API object

    // --- Main Message Handling Logic ---
    api.listenMqtt(async (err, event) => {
        if (err) return console.error("MQTT Error:", err);

        if (event.type === "message" || event.type === "message_reply") {
            const message = event.body;
            const threadID = event.threadID;
            const messageID = event.messageID;
            const senderID = event.senderID; // Assuming senderID is available

            // Assume 'adminID' is your bot's owner/admin ID for permission level 2
            // You should replace this with your actual permission checking system.
            const isAdmin = (senderID === "adminID"); // Simplified admin check
            const senderPermission = isAdmin ? 2 : 0; // 2 for admin, 0 for regular user

            if (message.startsWith(BOT_PREFIX)) {
                const parts = message.slice(BOT_PREFIX.length).trim().split(/\s+/);
                const commandName = parts[0]?.toLowerCase();
                const commandArgs = parts.slice(1);

                // --- Handle the built-in 'cmd' (command control) functionality ---
                if (commandName === "cmd") { // The name for your built-in command control
                    if (!isAdmin) { // Only admin can use this built-in feature
                        return api.sendMessage("You don't have permission to control commands.", threadID, messageID);
                    }

                    const action = commandArgs[0]?.toLowerCase();
                    const targetCmdName = commandArgs[1]?.toLowerCase();
                    const CMD_CONTROL_USAGES = `Usage:\n${BOT_PREFIX}cmd disable <commandName>\n${BOT_PREFIX}cmd enable <commandName>\n${BOT_PREFIX}cmd list`;

                    switch (action) {
                        case "disable":
                        case "off":
                            if (!targetCmdName) {
                                return api.sendMessage("Please provide a command name to disable.", threadID, messageID);
                            }
                            if (!globalCommands[targetCmdName]) {
                                return api.sendMessage(`Command '${targetCmdName}' does not exist.`, threadID, messageID);
                            }
                            if (targetCmdName === "cmd") { // Prevent disabling the control command itself
                                return api.sendMessage("You cannot disable the command control itself!", threadID, messageID);
                            }
                            if (disabledCommands.includes(targetCmdName)) {
                                return api.sendMessage(`Command '${targetCmdName}' is already disabled.`, threadID, messageID);
                            }

                            disabledCommands.push(targetCmdName);
                            try {
                                await writeDisabledCommandsToFile(disabledCommands);
                                api.sendMessage(`Command '${targetCmdName}' has been disabled.`, threadID, messageID);
                            } catch (error) {
                                api.sendMessage(`Failed to disable command: ${error.message}`, threadID, messageID);
                            }
                            break;

                        case "enable":
                        case "on":
                            if (!targetCmdName) {
                                return api.sendMessage("Please provide a command name to enable.", threadID, messageID);
                            }
                            if (!globalCommands[targetCmdName]) {
                                return api.sendMessage(`Command '${targetCmdName}' does not exist.`, threadID, messageID);
                            }
                            if (!disabledCommands.includes(targetCmdName)) {
                                return api.sendMessage(`Command '${targetCmdName}' is not currently disabled.`, threadID, messageID);
                            }

                            disabledCommands = disabledCommands.filter(cmd => cmd !== targetCmdName);
                            try {
                                await writeDisabledCommandsToFile(disabledCommands);
                                api.sendMessage(`Command '${targetCmdName}' has been enabled.`, threadID, messageID);
                            } catch (error) {
                                api.sendMessage(`Failed to enable command: ${error.message}`, threadID, messageID);
                            }
                            break;

                        case "list":
                            if (disabledCommands.length === 0) {
                                return api.sendMessage("No commands are currently disabled.", threadID, messageID);
                            }
                            const list = disabledCommands.map(cmd => `- ${cmd}`).join("\n");
                            api.sendMessage(`Currently disabled commands:\n${list}`, threadID, messageID);
                            break;

                        default:
                            api.sendMessage(`Invalid action. ${CMD_CONTROL_USAGES}`, threadID, messageID);
                            break;
                    }
                    return; // Stop processing further for 'cmd' commands
                }

                // --- Handle regular commands ---
                const commandModule = globalCommands[commandName];

                if (commandModule) {
                    // Check command's required permission against sender's permission
                    if (commandModule.config.hasPermssion > senderPermission) {
                        return api.sendMessage("You don't have permission to use this command.", threadID, messageID);
                    }

                    // CRITICAL: Disabled Command Check for regular commands
                    if (disabledCommands.includes(commandName)) {
                        return api.sendMessage(`Sorry, the command '${commandName}' is currently disabled.`, threadID, messageID);
                    }

                    // If not disabled and has permission, execute the command
                    try {
                        console.log(`[EXEC] Running ${commandName} for ${senderID} in ${threadID}`);
                        await commandModule.run({
                            event,
                            args: commandArgs,
                            api,
                            // Pass globalCommands for any command that might need to inspect others
                            globalCommands 
                            // You might also pass other common objects like 'config', 'utils' etc.
                        });
                    } catch (cmdError) {
                        console.error(`Error running command '${commandName}':`, cmdError);
                        api.sendMessage(`An error occurred while trying to run the command '${commandName}'.`, threadID, messageID);
                    }
                } else {
                    // Command not found message (optional, to avoid spam or show a general help)
                    // api.sendMessage("Command not found.", threadID, messageID);
                }
            }
        }
    });
}

// Start the bot
startBot();