const { spawn, execSync } = require("child_process"); // Add execSync for synchronous execution
// const axios = require("axios"); // axios is no longer needed if update check is removed
const logger = require("./utils/log");
const express = require('express');
const path = require('path');
const fs = require('fs'); // Needed to check for node_modules existence

///////////////////////////////////////////////////////////
//========= Dependency Check & Installation =========//
///////////////////////////////////////////////////////////

// Function to check if a package is available to be required
function isPackageInstalled(packageName) {
    try {
        require.resolve(packageName);
        return true;
    } catch (e) {
        return false;
    }
}

// Function to ensure a specific dependency is installed
function ensurePackageInstalled(packageName) {
    if (!isPackageInstalled(packageName)) {
        logger(`Package "${packageName}" not found. Attempting to install...`, "[ SETUP ]");
        try {
            // Using execSync to ensure installation completes before proceeding
            // stdio: 'inherit' will show npm's output in your terminal
            execSync(`npm install ${packageName}`, { stdio: 'inherit' });
            logger(`Successfully installed "${packageName}".`, "[ SETUP ]");
        } catch (error) {
            logger(`Failed to install "${packageName}": ${error.message}`, "[ ERROR ]");
            logger("Please run 'npm install @google/generative-ai' manually in your terminal.", "[ ERROR ]");
            process.exit(1); // Exit if critical dependency cannot be installed
        }
    } else {
        logger(`Package "${packageName}" already installed.`, "[ SETUP ]");
    }
}

// Call this at the very beginning to ensure dependencies are met
ensurePackageInstalled("@google/generative-ai");


///////////////////////////////////////////////////////////
//========= Create website for dashboard/uptime =========//
///////////////////////////////////////////////////////////

const app = express();
const port = process.env.PORT || 8080;

// Serve the index.html file
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server and add error handling
app.listen(port, () => {
    logger(`Server is running on port ${port}...`, "[ Starting ]");
}).on('error', (err) => {
    if (err.code === 'EACCES') {
        logger(`Permission denied. Cannot bind to port ${port}.`, "[ Error ]");
    } else {
        logger(`Server error: ${err.message}`, "[ Error ]");
    }
});

/////////////////////////////////////////////////////////
//========= Create start bot and make it loop =========//
/////////////////////////////////////////////////////////

// Initialize global restart counter
global.countRestart = global.countRestart || 0;

function startBot(message) {
    if (message) logger(message, "[ Starting ]");

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "Cyber.js"], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    child.on("close", (codeExit) => {
        if (codeExit !== 0 && global.countRestart < 5) {
            global.countRestart += 1;
            logger(`Bot exited with code ${codeExit}. Restarting... (${global.countRestart}/5)`, "[ Restarting ]");
            startBot();
        } else {
            logger(`Bot stopped after ${global.countRestart} restarts.`, "[ Stopped ]");
        }
    });

    child.on("error", (error) => {
        logger(`An error occurred: ${JSON.stringify(error)}`, "[ Error ]");
    });
};

// Start the bot
startBot();
