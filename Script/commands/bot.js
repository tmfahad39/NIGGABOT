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

// A map to track users who are in an active conversation with the bot.
const conversations = new Map();

// --- MODIFIED: Updated config for new commands ---
module.exports.config = {
  name: "Obot",
  version: "3.5.0", // Incremented version
  hasPermssion: 0,
  credits: "Modified by AI Assistant",
  description: "Greets users and responds with Gemini AI. Use 'bot' or 'botstart' to begin and 'botstop' to end.",
  commandCategory: "Noprefix",
  usages: "bot | botstart | botstop | reply to bot",
  cooldowns: 3,
};
// --------------------------------------------------

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
  const messageBody = event.body.toLowerCase(); // Standardize for checks

  // --- MODIFIED: Handle initial triggers "bot" OR "botstart" ---
  if ((messageBody === "bot" || messageBody === "botstart") && senderID !== botID) {
    const name = await Users.getNameUser(senderID);
    const msg = {
      body: `Hello @${name}, I am powered by Gemini. You can ask me anything by replying to this message.\n\nType "botstop" at any time to end our conversation.`,
      mentions: [{
        tag: `@${name}`,
        id: senderID
      }]
    };
    
    // Add the user to the conversation map to allow them to reply.
    conversations.set(senderID, true);

    return api.sendMessage(msg, event.threadID, event.messageID);
  }
  // -------------------------------------------------------------
  
  // Handle the "botstop" command to end the conversation
  if (messageBody === "botstop" && senderID !== botID) {
    // Check if the user was actually in a conversation
    if (conversations.has(senderID)) {
      // Remove the user from the map to stop the bot from replying
      conversations.delete(senderID);
      return api.sendMessage("You have ended the conversation. I will no longer reply. Type 'bot' or 'botstart' to begin a new one.", event.threadID, event.messageID);
    }
    return; // Ignore if they weren't in a conversation
  }

  // Handle when a user replies to the bot's message
  if (event.messageReply && event.messageReply.senderID == botID && conversations.has(senderID)) {
    const userPrompt = event.body;

    // Add a "typing" indicator to show the bot is thinking
    api.sendTypingIndicator(event.threadID);

    try {
      // Generate content using the user's prompt
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const geminiResponse = response.text();

      // Send the response from Gemini back to the user
      return api.sendMessage(geminiResponse, event.threadID, event.messageID);

    } catch (error) {
      console.error("Gemini API Error:", error);
      // Send a fallback message if the API fails
      return api.sendMessage("Sorry, I'm having a little trouble thinking right now. Please try again later.", event.threadID, event.messageID);
    }
  }
};

module.exports.run = function({ api, event, client, __GLOBAL }) {};