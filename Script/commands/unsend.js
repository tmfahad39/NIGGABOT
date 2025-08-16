module.exports.config = {
	name: "unsend",
	version: "2.0.0", // Increased version to reflect major change
	hasPermssion: 0,
	credits: "𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 -𝐁𝐎𝐓 ⚠️ 𝑻𝑬𝑨𝑴_ ☢️ (modified by AI Assistant)",
	description: "Unsend a bot message by replying 'u' or 'unsend' (no prefix needed).",
	commandCategory: "system",
	usages: "[reply 'u' to a bot's message]",
	cooldowns: 0
};

module.exports.languages = {
	"vi": {
		"returnCant": "Không thể gỡ tin nhắn của người khác.",
		"missingReply": "Hãy reply tin nhắn cần gỡ." // This is no longer used by handleEvent but kept for reference
	},
	"en": {
		"returnCant": "আরে বলদ অন্য কারো মেসেজ আমি আনসেন্ড করবো কিভাবে পাগল ছাগল",
		"missingReply": "আপনি আমার কোন মেসেজটি আনসেন্ড করবেন , তা রিপ্লাই করুন 🌺"
	}
};

// This function will run for every event, including every message
module.exports.handleEvent = function({ api, event, getText }) {
	// Check if the message body is 'u' or 'unsend' (case-insensitive)
	const trigger = event.body.toLowerCase().trim();
	if (trigger !== 'u' && trigger !== 'unsend') {
		return; // If it's not our trigger word, do nothing.
	}

	// Check if this message is a reply to another message
	if (event.type != "message_reply" || !event.messageReply) {
		return; // If it's not a reply, do nothing.
	}

	// Check if the replied-to message was sent by the bot itself
	if (event.messageReply.senderID == api.getCurrentUserID()) {
		// If all conditions are met, unsend the bot's message
		return api.unsendMessage(event.messageReply.messageID);
	}
};

// This function now just provides instructions if someone tries to use it with a prefix
module.exports.run = function({ api, event }) {
	return api.sendMessage("This is a noprefix command.\nTo use it, simply reply 'u' or 'unsend' to one of my messages.", event.threadID, event.messageID);
};