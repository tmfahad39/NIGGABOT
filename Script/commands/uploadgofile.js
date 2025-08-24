const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

module.exports.config = {
    name: "uploadgofile", // Internal name of the command
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Your Name",
    description: "Uploads replied file attachments to gofile.io and provides a download link.",
    commandCategory: "utility",
    usages: "upload [reply to attachment]", // Changed usages
    cooldowns: 5,
};

module.exports.onLoad = function ({ api, event, global }) {};

module.exports.run = async function ({ api, event, args }) {
    // Updated instructional message for the 'upload' command
    api.sendMessage("To upload a file, please reply to a message containing an attachment with the command: upload", event.threadID, event.messageID);
};

module.exports.onEvent = async function ({ api, event }) {
    // Check if the event is a reply AND the message body (after prefix stripping) is exactly "upload"
    if (event.type === "message_reply" && event.body && event.body.toLowerCase() === "upload") {
        const repliedMessage = event.messageReply;

        if (!repliedMessage.attachments || repliedMessage.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to a message that contains a file or media attachment with 'upload'.", event.threadID, event.messageID);
        }

        const fileAttachments = repliedMessage.attachments.filter(att =>
            att.type === "photo" || att.type === "video" || att.type === "animated_image" || att.type === "audio" || att.type === "file"
        );

        if (fileAttachments.length === 0) {
            return api.sendMessage("❌ The replied message does not contain a supported file or media attachment.", event.threadID, event.messageID);
        }

        const attachment = fileAttachments[0];
        const fileURL = attachment.url;
        const fileName = attachment.name || `attachment.${attachment.type || 'bin'}`;

        api.sendMessage(`🚀 Uploading "${fileName}" to Gofile.io... This might take a moment.`, event.threadID, event.messageID);

        try {
            const fileResponse = await axios.get(fileURL, { responseType: 'arraybuffer' });
            const fileBuffer = Buffer.from(fileResponse.data);

            let gofileServer = 'upload.gofile.io';
            try {
                const serverListResponse = await axios.get('https://api.gofile.io/servers');
                if (serverListResponse.data.status === 'ok' && serverListResponse.data.data.servers.length > 0) {
                    gofileServer = serverListResponse.data.data.servers[0].name + '.gofile.io';
                }
            } catch (serverError) {
                // Log the server error for debugging if needed, but don't stop execution
            }

            const formData = new FormData();
            formData.append('file', Readable.from(fileBuffer), {
                filename: fileName,
                contentType: attachment.contentType || 'application/octet-stream',
                knownLength: fileBuffer.length
            });

            const uploadResponse = await axios.post(`https://${gofileServer}/uploadFile`, formData, {
                headers: formData.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
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