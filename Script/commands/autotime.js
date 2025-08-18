module.exports.config = {
    name: '𝐂𝐘𝐁𝐄𝐑 ☢️_𖣘 BOT',
    version: '10.02',
    hasPermssion: 0,
    credits: 'CYBER ☢️_𖣘 TEAM.',
    description: 'এটি একটি স্বয়ংক্রিয় বার্তাগুলি পাঠানোর সময় অনুযায়ী কমান্ড।এই বট টি স্বয়ংক্রিয়ভাবে বিভিন্ন সময় অনুযায়ী আপনাকে মেসেজ পাঠাবে!', // Translation: "This is an automatic message sending command. This bot will automatically send you messages according to different times!"
    commandCategory: 'group messenger',
    usages: '[]',
    cooldowns: 3
};

const nam = [
    {
        timer: '5:00:00 AM',
        message: ['__এখন ভোর ৫টা বাজে,সবাই ঘুম থেকে উঠো সবাই,আ সালাম পড়ে নিও ']
    },
    {
        timer: '6:00:00 AM',
        message: ['__এখন সকাল ৬টা বাজে,সবাই দাতমুখ ধুয়ে গোসল করে নাও ok🤗 ']
    },
    {
        timer: '7:00:00 AM',
        message: ['__এখন সকাল ৭টা বাজে,সবাই ব্রেকফাস্ট করে নাও🤗❤️']
    },
    {
        timer: '8:00:00 AM',
        message: ['__এখন সকাল ৮টা বাজে,সবাই স্কুল শুটিন শেষ করে যাও😍.']
    },
    {
        timer: '9:00:00 AM',
        message: ['__এখন সকাল ৯টা বাজে,কিছু মানুষ হয়তো,চলে গেলো সবার স্কুল-কলেজ এর ক্লাসটা মিস করছি ']
    },
    {
        timer: '10:00:00 AM',
        message: ['__এখন সকাল ১০টা বাজে,সবাই কাজ করতেছে😛']
    },
    {
        timer: '11:00:00 AM',
        message: ['__এখন সকাল ১১টা বাজে,সবাই আড্ডা ও দিতাসে,আর কিছু মানুষ প্রেম করে তারা জেনে যায় 😩']
    },
    {
        timer: '12:00:00 PM',
        message: ['__এখন দুপুর ১২টা বাজে,সবাই কাজ হয়ে গেছে,আর কিছু মানুষ বসে আছে,কেউ খেলা ও আসে না😭আ']
    },
    {
        timer: '1:00:00 PM',
        message: ['__এখন দুপুর ১টা বাজে,সবাই দুপুরের খাবার খেয়ে নাও🤗🤗.']
    },
    {
        timer: '2:00:00 PM',
        message: ['__এখন দুপুর ২টা বাজে যারা,প্রেম করে তারা জানি মেসেঞ্জারে ঢুকছে,আর কিছু মানুষ ঘুমায়😑আও এখন পড়তে বসো সবাই🙂.']
    },
    {
        timer: '3:00:00 PM',
        message: ['__এখন বিকেল ৩টা বাজে,সবাই একটু কাজ বন্ধ করে,আরাম করে ঘুমিয়ে নাও,,!😒😊']
    },
    {
        timer: '4:00:00 PM',
        message: ['__এখন বিকেল ৪টা বাজে,এখান আসরের আযান দিতাসে,আও নামাজ পড়ে নিও সব']
    },
    {
        timer: '5:00:00 PM',
        message: ['__এখন বিকেল ৫টা বাজে এখান সবাই হয়তো,বাসা থেকে সময় কাটায় মাঠে যাও😻']
    },
    {
        timer: '6:00:00 PM',
        message: ['__এখন সন্ধা ৬টা বাজে,সবাই দাত মুখ ধুলা করলে আ সালাম পড়ে নিও 🥀']
    },
    {
        timer: '7:00:00 PM',
        message: ['__এখন সন্ধা ৭টা বাজে সবাই নামাজ পড়ে নিও 🥀']
    },
    {
        timer: '8:00:00 PM',
        message: ['__এখন রাত ৮টা বাজে,এখন এশারের আযান দিচ্ছে,আও নামাজ পড়ে নিও সব']
    },
    {
        timer: '9:00:00 PM',
        message: ['__এখন রাত ৯টা বাজে,সবাই আড্ডা দিতাসে,আও সবাই ঘুমাও 😒']
    },
    {
        timer: '10:00:00 PM',
        message: ['__এখন রাত ১০টা বাজে,কিছু মানুষ ঘুমায়😑আও এখন পড়াশোনা করো সবাই🙂.']
    },
    {
        timer: '11:00:00 PM',
        message: ['__এখন রাত ১১টা বাজে,কিছু মানুষ হয়তো,চলে গেলো সবার স্কুল-কলেজ এর ক্লাসটা মিস করছি ']
    },
    {
        timer: '12:00:00 AM',
        message: ['__এখন রাত ১২টা বাজে,সবাই কাজ হয়ে গেছে,আর কিছু মানুষ বসে আছে,কেউ খেলা ও আসে না😭আ']
    },
    {
        timer: '1:00:00 AM',
        message: ['__এখন রাত ১টা বাজে সবাই,ঘুমাও 😒']
    },
    {
        timer: '2:00:00 AM',
        message: ['__এখন রাত ২টা বাজে যারা,প্রেম করে তারা জানি মেসেঞ্জারে ঢুকছে,আমার বউ নাই 😩']
    },
    {
        timer: '3:00:00 AM',
        message: ['__এখন রাত ৩টা বাজে,,সবাই দুপুরের খাবার খেয়ে নাও🤗🤗.']
    },
    {
        timer: '4:00:00 AM',
        message: ['__এখন রাত ৪টা বাজে,এখান আসরের আযান দিতাসে,আও নামাজ পড়ে নিও সব']
    }
];

module.exports.run = (api) => setInterval(() => {
    // Helper function to pick a random message from an array
    const getRandomMessage = (messageArray) => messageArray[Math.floor(Math.random() * messageArray.length)];

    // Calculate the current time with a 7-hour offset (25200000 milliseconds = 7 hours)
    const offsetTime = new Date(Date.now() + 25200000); // This offset is crucial for the intended timezone.

    // Format the time to match the 'timer' string format (e.g., "HH:MM:SS AM/PM")
    // It takes the locale string, splits by comma, gets the second part (time), and trims any whitespace.
    const currentTimeFormatted = offsetTime.toLocaleString().split(',')[1].trim();

    // Find a matching timer entry in the 'nam' array
    const matchingTimerEntry = nam.find(entry => entry.timer === currentTimeFormatted);

    if (matchingTimerEntry) {
        // If a match is found, select a random message from its array
        const messageToSend = getRandomMessage(matchingTimerEntry.message);

        // Send the message to all thread IDs stored in global.data.allThreadID
        global.data.allThreadID.forEach(threadID => api.sendMessage(messageToSend, threadID));
    }
}, 1000); // Check every 1000 milliseconds (1 second)

module.exports.onLoad = (api) => {
    // This function runs when the plugin is loaded.
    // Currently, it's empty, meaning no special setup is needed at load time.
};