const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "spotify",
    version: "1.1",
    hasPermssion: 0,
    credits: "Vex_Kshitiz | Fixed by ChatGPT",
    description: "Download & play Spotify music by song name or from replied media.",
    commandCategory: "music",
    usages: "[song name] or reply to audio/video",
    cooldowns: 5,
    dependencies: {
      "axios": "",
      "fs-extra": ""
    }
  },

  run: async function ({ api, event, args }) {
    let songQuery = "";

    try {
      api.setMessageReaction("🔄", event.messageID, () => {}, true);

      // Handle reply to audio/video
      if (event.messageReply && event.messageReply.attachments?.length > 0) {
        const attachment = event.messageReply.attachments[0];
        if (attachment.type === "audio" || attachment.type === "video") {
          const shortUrl = await shortenURL(attachment.url);
          const res = await axios.get(`https://audio-recon-ahcw.onrender.com/kshitiz?url=${encodeURIComponent(shortUrl)}`);
          songQuery = res.data.title;
        } else {
          throw new Error("❌ Please reply to a valid audio or video file.");
        }
      } else if (args.length === 0) {
        throw new Error("❌ Please provide a song name or reply to a media file.");
      } else {
        songQuery = args.join(" ");
      }

      const searchRes = await axios.get(`https://spotify-play-iota.vercel.app/spotify?query=${encodeURIComponent(songQuery)}`);
      const trackList = searchRes.data.trackURLs;

      if (!trackList || trackList.length === 0) {
        throw new Error("❌ No song found on Spotify.");
      }

      const trackID = trackList[0];
      const dlRes = await axios.get(`https://sp-dl-bice.vercel.app/spotify?id=${encodeURIComponent(trackID)}`);
      const downloadUrl = dlRes.data.download_link;

      if (!downloadUrl) throw new Error("❌ Failed to get the download link.");

      const filePath = await downloadFile(downloadUrl);

      await api.sendMessage({
        body: `🎧 Now playing: ${songQuery}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error(err);
      api.sendMessage(`❌ Error: ${err.message}`, event.threadID, event.messageID);
    }
  }
};

async function downloadFile(url) {
  const cacheDir = path.join(__dirname, "cache");
  await fs.ensureDir(cacheDir);
  const filename = `spotify_${Date.now()}.mp3`;
  const filePath = path.join(cacheDir, filename);

  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream"
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", () => resolve(filePath));
    writer.on("error", reject);
  });
}

async function shortenURL(url) {
  try {
    const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    return res.data;
  } catch {
    return url; // fallback
  }
}