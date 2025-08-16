const fs = require("fs-extra");
const path = require("path");

// Define the path for our log file in a persistent location
const logFilePath = path.join(__dirname, "..", "cache", "cmdlog.json");

// Helper function to ensure the log file exists
function ensureLogFile() {
    if (!fs.existsSync(logFilePath)) {
        fs.writeJsonSync(logFilePath, [], { spaces: 2 });
    }
}

module.exports.config = {
    name: "cmdlog",
    version: "1.0.0",
    hasPermssion: 1, // 1 = Group Admin, 2 = Bot Admin. Set as you see fit.
    credits: "AI Assistant for Acode",
    description: "Logs command usage and allows admins to view the recent activity.",
    commandCategory: "system",
    usages: "cmdlog [number of entries to show]",
    cooldowns: 5
};

module.exports.languages = {
    "en": {
        "noLogs": "No command usage has been logged yet.",
        "viewingLogs": "📜 Viewing the last %1 command usages:\n\n%2",
        "logEntry": "%1. [%2] %3 used '%4' in thread %5"
    },
    "vi": {
        "noLogs": "Chưa có lệnh nào được ghi lại.",
        "viewingLogs": "📜 Đang xem %1 lệnh được sử dụng gần đây nhất:\n\n%2",
        "logEntry": "%1. [%2] %3 đã dùng '%4' trong nhóm %5"
    }
};

// This function runs for every event/message and LOGS the commands.
module.exports.handleEvent = async function({ event }) {
    // Check if the event is a message and has a body
    if (event.type !== "message" || !event.body) return;

    // Use the global prefix from your bot's config
    const prefix = global.config.PREFIX || "-";
    
    // Ignore messages that don't start with the prefix or are from the bot itself
    if (!event.body.startsWith(prefix) || event.senderID === global.data.botID) return;

    const commandName = event.body.slice(prefix.length).trim().split(" ")[0].toLowerCase();
    
    // Check if the command actually exists
    if (!global.client.commands.has(commandName) && !global.client.aliases.has(commandName)) return;

    ensureLogFile();
    const logData = fs.readJsonSync(logFilePath);

    // Create the new log entry
    const newEntry = {
        timestamp: new Date().toISOString(),
        userID: event.senderID,
        threadID: event.threadID,
        command: commandName
    };

    // Add the new entry to the beginning of the array
    logData.unshift(newEntry);
    
    // Keep the log from getting too big (e.g., max 100 entries)
    if (logData.length > 100) {
        logData.pop();
    }

    // Write the updated log back to the file
    fs.writeJsonSync(logFilePath, logData, { spaces: 2 });
};

// This function runs when an admin uses the -cmdlog command to VIEW the logs.
module.exports.run = async function({ api, event, args, getText }) {
    ensureLogFile();
    const logData = fs.readJsonSync(logFilePath);

    if (logData.length === 0) {
        return api.sendMessage(getText("noLogs"), event.threadID, event.messageID);
    }
    
    const count = args[0] ? parseInt(args[0]) : 10;
    const recentLogs = logData.slice(0, count);

    const userNames = {};
    let formattedLogs = [];
    let entryNumber = 1;

    for (const entry of recentLogs) {
        let userName = userNames[entry.userID];
        if (!userName) {
            try {
                const userInfo = await api.getUserInfo(entry.userID);
                userName = userInfo[entry.userID]?.name || `User ${entry.userID}`;
                userNames[entry.userID] = userName;
            } catch {
                userName = `User ${entry.userID}`;
            }
        }
        
        const time = new Date(entry.timestamp).toLocaleTimeString();
        formattedLogs.push(
            getText("logEntry", entryNumber++, time, userName, entry.command, entry.threadID)
        );
    }

    const message = getText("viewingLogs", recentLogs.length, formattedLogs.join("\n"));
    api.sendMessage(message, event.threadID, event.messageID);
};