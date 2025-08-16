// We need to require the package we just installed
const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports.config = {
  name: "Obot",
  version: "3.0.0", // Upgraded to Gemini version!
  hasPermssion: 0,
  credits: "Modified by AI Assistant",
  description: "Greets users and responds with Gemini AI.",
  commandCategory: "Noprefix",
  usages: "bot | reply to bot",
  cooldowns: 5,
};

// --- START OF GEMINI CONFIGURATION ---

// PASTE YOUR GEMINI API KEY HERE
const API_KEY = "AIzaSyBVmU2I4oHWKKfutGnXUOyMjLZglxcSPpA"; 

// Initialize the Google Generative AI with your key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// --- END OF GEMINI CONFIGURATION ---


module.exports.handleEvent = async function({ api, event, Users }) {
  const botID = api.getCurrentUserID();

  // 1. Handle the initial trigger "bot"
  if (event.body.toLowerCase() === "bot" && event.senderID !== botID) {
    const name = await Users.getNameUser(event.senderID);
    const msg = {
      body: `Hello @${name}, I am powered by Gemini. You can ask me anything by replying to this message.`,
      mentions: [{
        tag: `@${name}`,
        id: event.senderID
      }]
    };
    return api.sendMessage(msg, event.threadID, event.messageID);
  }

  // 2. Handle when a user replies to the bot's message
  if (event.messageReply && event.messageReply.senderID == botID) {
    const userPrompt = event.body; // This is the user's question

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