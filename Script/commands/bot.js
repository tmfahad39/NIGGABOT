// --- START OF DEPENDENCY INSTALLER ---
// This block checks if the required package is installed and installs it if not.
try {
    require.resolve("@google/generative-ai");
} catch (e) {
    console.log("[DEPENDENCY] @google/generative-ai not found, installing...");
    const { execSync } = require("child_process");
    // Using --save will add it to your package.json if it exists
    execSync("npm install @google/generative-ai --save");
    console.log("[DEPENDENCY] Successfully installed @google/generative-ai.");
}
// --- END OF DEPENDENCY INSTALLER ---


// Now we can safely require the package
const { GoogleGenerativeAI } = require("@google/generative-ai");

// NEW: A map to track users who are in an active conversation with the bot.
const conversations = new Map();

module.exports.config = {
  name: "Obot",
  version: "3.3.0", // Updated version for the fix
  hasPermssion: 0,
  credits: "Modified by AI Assistant",
  description: "Greets users and responds with Gemini AI. Only replies to its own conversation thread.",
  commandCategory: "Noprefix",
  usages: "bot | reply to bot",
  cooldowns: 3,
};

// --- START OF GEMINI CONFIGURATION ---

// PASTE YOUR GEMINI API KEY HERE
const API_KEY = "AIzaSyBVmU2I4oHWKKfutGnXUOyMjLZglxcSPpA"; 

// Initialize the Google Generative AI with your key
const genAI = new GoogleGenerativeAI(API_KEY);
// Using the lighter and faster Flash model for quick responses
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// --- END OF GEMINI CONFIGURATION ---


module.exports.handleEvent = async function({ api, event, Users }) {
  const botID = api.getCurrentUserID();
  const senderID = event.senderID;

  // 1. Handle the initial trigger "bot"
  if (event.body.toLowerCase() === "bot" && senderID !== botID) {
    const name = await Users.getNameUser(senderID);
    const msg = {
      body: `Hello @${name}, I am powered by Gemini. You can ask me anything by replying to this message.`,
      mentions: [{
        tag: `@${name}`,
        id: senderID
      }]
    };
    
    // NEW: Add the user to the conversation map to allow them to reply.
    conversations.set(senderID, true);

    return api.sendMessage(msg, event.threadID, event.messageID);
  }

  // 2. Handle when a user replies to the bot's message
  // NEW: Added a check 'conversations.has(senderID)'
  if (event.messageReply && event.messageReply.senderID == botID && conversations.has(senderID)) {
    const userPrompt = event.body; // This is the user's question

    // Add a "typing" indicator to show the bot is thinking
    api.sendTypingIndicator(event.threadID);

    try {
      // Generate content using the user's prompt
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const geminiResponse = response.text();

      // Send the response from Gemini back to the user
      // A reply to this message will also be handled, continuing the conversation.
      return api.sendMessage(geminiResponse, event.threadID, event.messageID);

    } catch (error) {
      console.error("Gemini API Error:", error);
      // Send a fallback message if the API fails
      return api.sendMessage("Sorry, I'm having a little trouble thinking right now. Please try again later.", event.threadID, event.messageID);
    }
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {};