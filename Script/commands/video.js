const axios = require("axios");
const fs = require('fs');

// --- START: MODIFIED baseApiUrl ---
// Replace this with the base URL of your chosen new YouTube API.
// You might want to hardcode it directly if the external JSON is unreliable.
const baseApiUrl = async () => {
    // IMPORTANT: Replace this with the actual base URL of the new YouTube API you found.
    // Example: "https://api.example.com/youtube" or "https://youtube-api.service.io"
    return "https://yt-dl.org/downloads/latest/youtube-dl";
};
// --- END: MODIFIED baseApiUrl ---

module.exports = {
    config: {
        name: "youtube", // Keep the command name
        version: "1.1.5", // Update version if you like
        credits: "Diddy & Niga (API update)", // Add yourself for the fix!
        countDown: 5,
        hasPermssion: 0,
        description: "Download video, audio, and info from YouTube using a new API",
        category: "media",
        commandCategory: "media",
        usePrefix: true,
        prefix: true,
        usages:
            " {pn} [video|-v] [<video name>|<video link>]\n" +
            " {pn} [audio|-a] [<video name>|<video link>]\n" +
            " {pn} [info|-i] [<video name>|<video link>]\n" +
            "Example:\n" +
            "{pn} -v chipi chipi chapa chapa\n" +
            "{pn} -a chipi chipi chapa chapa\n" +
            "{pn} -i chipi chipi chapa chapa"
    },

    run: async ({ api, args, event }) => {
        const { threadID, messageID, senderID } = event;

        if (!args[0]) return api.sendMessage('❌ Please provide an action like -v, -a or -i.', threadID, messageID);
        const action = args[0].toLowerCase();

        // YouTube URL regex remains the same
        const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
        const urlYtb = args[1] ? checkurl.test(args[1]) : false;

        if (urlYtb) {
            const format = ['-v', 'video', 'mp4'].includes(action) ? 'mp4'
                : ['-a', 'audio', 'mp3'].includes(action) ? 'mp3' : null;

            if (!format) return api.sendMessage('❌ Invalid format. Use -v for video or -a for audio.', threadID, messageID);

            try {
                const match = args[1].match(checkurl);
                const videoID = match ? match[1] : null;
                if (!videoID) return api.sendMessage('❌ Invalid YouTube link.', threadID, messageID);

                const path = `ytb_${format}_${videoID}.${format}`;

                // --- START: MODIFIED API CALL for Direct URL Download ---
                // ADJUST THIS AXIOS CALL AND DATA EXTRACTION FOR YOUR NEW API'S DOWNLOAD ENDPOINT
                const apiUrl = `${await baseApiUrl()}/download`; // Example: /download or /get
                const response = await axios.get(apiUrl, {
                    params: {
                        id: videoID,       // Check if your new API uses 'id' or 'link' or 'videoId'
                        format: format,    // Check if your new API uses 'format' or 'type'
                        quality: 'highest' // Or '360p', '720p', etc. - check your API's options
                    }
                });

                // Assuming your new API returns { title: "...", downloadUrl: "...", quality: "..." }
                const { title, downloadUrl, quality } = response.data;

                if (!downloadUrl) {
                    return api.sendMessage('❌ Could not get download link from the new API.', threadID, messageID);
                }

                await api.sendMessage({
                    body: `• Title: ${title || 'N/A'}\n• Quality: ${quality || 'N/A'}`,
                    attachment: await downloadFile(downloadUrl, path) // Use the new 'downloadUrl' property
                }, threadID, () => fs.unlinkSync(path), messageID);

                // --- END: MODIFIED API CALL ---

                return;
            } catch (e) {
                console.error("Error in URL download:", e.response ? e.response.data : e.message); // Log API error response if available
                return api.sendMessage('❌ Failed to download from new API. Please check the link or try again later. Error: ' + (e.response ? e.response.status : e.message), threadID, messageID);
            }
        }

        args.shift();
        const keyWord = args.join(" ");
        if (!keyWord) return api.sendMessage('❌ Please provide a search keyword.', threadID, messageID);

        try {
            // --- START: MODIFIED API CALL for Search ---
            // ADJUST THIS AXIOS CALL AND DATA EXTRACTION FOR YOUR NEW API'S SEARCH ENDPOINT
            const searchApiUrl = `${await baseApiUrl()}/search`; // Example: /search or /query
            const searchResponse = await axios.get(searchApiUrl, {
                params: {
                    q: keyWord, // Check if your new API uses 'q' or 'songName' or 'query'
                    limit: 6    // Check if your new API supports a 'limit' parameter
                }
            });

            // Assuming your new API returns an array like:
            // [{ id: "...", title: "...", time: "...", thumbnail: "...", channel: { name: "..." } }]
            const searchResult = searchResponse.data.results ? searchResponse.data.results.slice(0, 6) : searchResponse.data.slice(0, 6); // Adapt to your API's response structure
            if (!searchResult.length) return api.sendMessage(`⭕ No results for keyword: ${keyWord}`, threadID, messageID);

            let msg = "";
            const thumbnails = [];
            let i = 1;

            for (const info of searchResult) {
                // Ensure 'info.thumbnail' and 'info.channel.name' exist in your new API's search results
                thumbnails.push(streamImage(info.thumbnail, `thumbnail_${i}.jpg`));
                msg += `${i++}. ${info.title}\nTime: ${info.time || 'N/A'}\nChannel: ${info.channel ? info.channel.name : 'N/A'}\n\n`;
            }

            api.sendMessage({
                body: msg + "👉 Reply to this message with a number to select.",
                attachment: await Promise.all(thumbnails)
            }, threadID, (err, info) => {
                if (err) return console.error(err);
                global.client.handleReply.push({
                    name: module.exports.config.name,
                    messageID: info.messageID,
                    author: senderID,
                    result: searchResult,
                    action
                });
            }, messageID);

            // --- END: MODIFIED API CALL ---

        } catch (err) {
            console.error("Error in search:", err.response ? err.response.data : err.message); // Log API error response
            return api.sendMessage("❌ An error occurred while searching with the new API: " + (err.response ? err.response.status : err.message), threadID, messageID);
        }
    },

    handleReply: async ({ event, api, handleReply }) => {
        const { threadID, messageID, senderID, body } = event;

        if (senderID !== handleReply.author) return;
        const { result, action } = handleReply;
        const choice = parseInt(body);

        if (isNaN(choice) || choice <= 0 || choice > result.length)
            return api.sendMessage("❌ Invalid number. Please reply with a valid number.", threadID, messageID);

        const selectedVideo = result[choice - 1];
        // Ensure 'selectedVideo.id' exists in your new API's search results
        const videoID = selectedVideo.id;

        try {
            await api.unsendMessage(handleReply.messageID);
        } catch (e) {
            console.error("Unsend failed:", e);
        }

        if (['-v', 'video', 'mp4', '-a', 'audio', 'mp3', 'music'].includes(action)) {
            const format = ['-v', 'video', 'mp4'].includes(action) ? 'mp4' : 'mp3';
            try {
                const path = `ytb_${format}_${videoID}.${format}`;

                // --- START: MODIFIED API CALL for Reply Download ---
                // ADJUST THIS AXIOS CALL AND DATA EXTRACTION FOR YOUR NEW API'S DOWNLOAD ENDPOINT
                const apiUrl = `${await baseApiUrl()}/download`; // Example: /download or /get
                const response = await axios.get(apiUrl, {
                    params: {
                        id: videoID,
                        format: format,
                        quality: 'highest' // Or '360p', '720p', etc. - check your API's options
                    }
                });

                // Assuming your new API returns { title: "...", downloadUrl: "...", quality: "..." }
                const { title, downloadUrl, quality } = response.data;

                if (!downloadUrl) {
                    return api.sendMessage('❌ Could not get download link from the new API.', threadID, messageID);
                }

                await api.sendMessage({
                    body: `• Title: ${title || 'N/A'}\n• Quality: ${quality || 'N/A'}`,
                    attachment: await downloadFile(downloadUrl, path)
                }, threadID, () => fs.unlinkSync(path), messageID);

                // --- END: MODIFIED API CALL ---

            } catch (e) {
                console.error("Error in reply download:", e.response ? e.response.data : e.message);
                return api.sendMessage('❌ Failed to download from new API. Please try again later. Error: ' + (e.response ? e.response.status : e.message), threadID, messageID);
            }
        }

        if (action === '-i' || action === 'info') {
            try {
                // --- START: MODIFIED API CALL for Info ---
                // ADJUST THIS AXIOS CALL AND DATA EXTRACTION FOR YOUR NEW API'S INFO ENDPOINT
                const infoApiUrl = `${await baseApiUrl()}/info`; // Example: /info or /details
                const infoResponse = await axios.get(infoApiUrl, {
                    params: {
                        id: videoID // Check if your new API uses 'id' or 'videoId'
                    }
                });

                // Assuming your new API returns:
                // { title: "...", duration_seconds: 123, resolution: "...", views: 12345, likes: 6789, comments: 123, categories: ["..."], channel_name: "...", uploader_id: "...", subscribers: 12345, channel_url: "...", video_url: "...", thumbnail: "..." }
                const data = infoResponse.data;

                // Adjust these property names to match your new API's response
                await api.sendMessage({
                    body: `✨ Title: ${data.title || 'N/A'}\n` +
                        `⏳ Duration: ${data.duration_seconds ? (data.duration_seconds / 60).toFixed(2) : 'N/A'} mins\n` +
                        `📺 Resolution: ${data.resolution || 'N/A'}\n` +
                        `👀 Views: ${data.views || 'N/A'}\n` +
                        `👍 Likes: ${data.likes || 'N/A'}\n` +
                        `💬 Comments: ${data.comments || 'N/A'}\n` +
                        `📂 Category: ${data.categories && data.categories[0] ? data.categories[0] : 'N/A'}\n` +
                        `📢 Channel: ${data.channel_name || 'N/A'}\n` +
                        `🧍 Uploader ID: ${data.uploader_id || 'N/A'}\n` +
                        `👥 Subscribers: ${data.subscribers || 'N/A'}\n` +
                        `🔗 Channel URL: ${data.channel_url || 'N/A'}\n` +
                        `🔗 Video URL: ${data.video_url || 'N/A'}`,
                    attachment: await streamImage(data.thumbnail, 'info_thumb.jpg')
                }, threadID, messageID);

                // --- END: MODIFIED API CALL ---

            } catch (e) {
                console.error("Error in info:", e.response ? e.response.data : e.message);
                return api.sendMessage('❌ Failed to retrieve video info from new API. Error: ' + (e.response ? e.response.status : e.message), threadID, messageID);
            }
        }
    }
};

// Helper functions remain the same as they handle local file operations, not API calls.
async function downloadFile(url, pathName) {
    try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(pathName, Buffer.from(res.data));
        return fs.createReadStream(pathName);
    } catch (err) {
        throw err;
    }
}

async function streamImage(url, pathName) {
    try {
        const response = await axios.get(url, { responseType: "stream" });
        response.data.path = pathName;
        return response.data;
    } catch (err) {
        throw err;
    }
}