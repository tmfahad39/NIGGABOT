// You might need to add these 'require' statements at the top of your plugin file
// if axios and form-data are not globally available in your Acode environment.
const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream'); // For handling file buffer as a stream

module.exports.config = {
    name: "uploadgofile", // Internal name of the command
    version: "1.0.0",
    hasPermssion: 0, // 0 = all users, 1 = admin, 2 = super admin
    credits: "Your Name", // Replace with your name or team
    description: "Uploads replied file attachments to gofile.io and provides a download link.",
    commandCategory: "utility",
    usages: "-file [reply to attachment]", // User is instructed to type -file
    cooldowns: 5, // 5 seconds cooldown to prevent spam
};

module.exports.onLoad = function ({ api, event, global }) {
    // You might want to initialize global settings or API keys here if needed.
    // For gofile.io, an API key is optional for uploads but can increase limits.
};

module.exports.run = async function ({ api, event, args }) {
    // This 'run' function is for direct command usage.
    // Since this command is designed to work as a reply, the 'run' function
    // itself won't have much to do directly but will provide instructions.
    api.sendMessage("To upload a file, please reply to a message containing an attachment with the command: -file", event.threadID, event.messageID);
};

module.exports.onEvent = async function ({ api, event }) {
    // Check if the event is a reply AND the message body (after prefix stripping) is exactly "file"
    if (event.type === "message_reply" && event.body && event.body.toLowerCase() === "file") {
        const repliedMessage = event.messageReply;

        // Check if the replied message actually has attachments
        if (!repliedMessage.attachments || repliedMessage.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to a message that contains a file or media attachment with '-file'.", event.threadID, event.messageID);
        }

        // Filter for actual file/media attachments (not stickers, locations, etc.)
        const fileAttachments = repliedMessage.attachments.filter(att =>
            att.type === "photo" || att.type === "video" || att.type === "animated_image" || att.type === "audio" || att.type === "file"
        );

        if (fileAttachments.length === 0) {
            return api.sendMessage("❌ The replied message does not contain a supported file or media attachment.", event.threadID, event.messageID);
        }

        // For simplicity, we'll only upload the first attachment found.
        const attachment = fileAttachments[0];
        const fileURL = attachment.url;
        const fileName = attachment.name || `attachment.${attachment.type || 'bin'}`; // Default filename if not available

        api.sendMessage(`🚀 Uploading "${fileName}" to Gofile.io... This might take a moment.`, event.threadID, event.messageID);

        try {
            // 1. Download the file from the attachment URL
            const fileResponse = await axios.get(fileURL, { responseType: 'arraybuffer' });
            const fileBuffer = Buffer.from(fileResponse.data);

            // 2. Get the best Gofile.io server for upload
            let gofileServer = 'upload.gofile.io'; // Default if server API fails
            try {
                const serverListResponse = await axios.get('https://api.gofile.io/servers');
                if (serverListResponse.data.status === 'ok' && serverListResponse.data.data.servers.length > 0) {
                    gofileServer = serverListResponse.data.data.servers[0].name + '.gofile.io';
                }
            } catch (serverError) {
                console.warn("Could not fetch Gofile server list, using default. Error:", serverError.message);
            }

            // 3. Prepare FormData for upload
            const formData = new FormData();
            // Gofile expects the file under the key 'file'
            // We use Readable.from(fileBuffer) to send the buffer as a stream,
            // which can be more efficient for FormData.
            formData.append('file', Readable.from(fileBuffer), {
                filename: fileName,
                contentType: attachment.contentType || 'application/octet-stream',
                knownLength: fileBuffer.length // Important for stream uploads
            });

            // Gofile API documentation sometimes mentions an optional 'token' field if you have an account
            // If you have a Gofile API token, you can add it here:
            // formData.append('token', 'YOUR_GOFILE_API_TOKEN');

            // 4. Upload the file to Gofile.io
            const uploadResponse = await axios.post(`https://${gofileServer}/uploadFile`, formData, {
                headers: formData.getHeaders(),
                maxContentLength: Infinity, // Important for large files
                maxBodyLength: Infinity,     // Important for large files
            });

            if (uploadResponse.data.status === "ok") {
                const downloadLink = uploadResponse.data.data.downloadPage;
                api.sendMessage(`✅ File uploaded successfully!\n\nDownload Link: ${downloadLink}`, event.threadID, event.messageID);
            } else {
                api.sendMessage(`❌ Gofile.io upload failed: ${uploadResponse.data.error || "Unknown error."}`, event.threadID, event.messageID);
            }

        } catch (error) {
            console.error("Error in Gofile upload process:", error);
            let errorMessage = "An unexpected error occurred during upload.";
            if (error.response) {
                errorMessage = `Gofile API Error: ${error.response.status} - ${error.response.data.error || JSON.stringify(error.response.data)}`;
            } else if (error.request) {
                errorMessage = "Gofile.io did not respond. Please check your internet connection or try again later.";
            } else {
                errorMessage = `Error: ${error.message}`;
            }
            api.sendMessage(`❌ Failed to upload file: ${errorMessage}`, event.threadID, event.messageID);
        }
    }
};