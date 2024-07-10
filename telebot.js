import { TiktokDL } from './lib/ttapi.js';
import { ReelsUpload } from './lib/browserHandler.js';
import dotenv from 'dotenv';
import TeleBot from 'telebot';
import axios from 'axios';
import ProgressBar from 'progress';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

dotenv.config();

const bot = new TeleBot({
    token: process.env.BOT_TOKEN
});

const userStats = new Map();
const MAX_DOWNLOADS_PER_DAY = 5;

function updateUserStats(userId) {
    const today = new Date().toDateString();
    if (!userStats.has(userId)) {
        userStats.set(userId, { date: today, count: 1 });
    } else {
        const stats = userStats.get(userId);
        if (stats.date !== today) {
            stats.date = today;
            stats.count = 1;
        } else {
            stats.count++;
        }
    }
}

function canUserDownload(userId) {
    const stats = userStats.get(userId);
    return !stats || stats.count < MAX_DOWNLOADS_PER_DAY;
}

async function downloadTikTokVideo(url, outputPath) {
    try {
        const result = await TiktokDL(url);
        const video = result.result.video[0];
        const response = await axios({
            url: video,
            method: 'GET',
            responseType: 'stream'
        });

        const totalLength = response.headers['content-length'];
        const progressBar = new ProgressBar(`[ ${chalk.hex('#ffff1c')("Downloading")} ] [${chalk.hex('#6be585')(':bar')}] :percent in :elapseds`, {
            width: 40,
            complete: '<',
            incomplete: '•',
            renderThrottle: 1,
            total: parseInt(totalLength)
        });

        const writer = fs.createWriteStream(outputPath);
        response.data.on('data', (chunk) => progressBar.tick(chunk.length));
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}

async function handleTikTokUrl(msg, url) {
    try {
        const userId = msg.from.id;
        if (!canUserDownload(userId)) {
            return bot.sendMessage(msg.chat.id, `You've reached the daily limit of ${MAX_DOWNLOADS_PER_DAY} downloads.`);
        }

        await bot.sendMessage(msg.chat.id, "Processing...", { replyToMessage: msg.message_id });

        const result = await TiktokDL(url);
        const namafile = result.result.id;
        const caption = result.result.description;
        const outputPath = path.resolve('download', `${namafile}.mp4`);

        if (!fs.existsSync('download')) fs.mkdirSync('download');

        await downloadTikTokVideo(url, outputPath);

        const upload = await ReelsUpload(namafile, caption);
        
        if (upload.status === "success") {
            await bot.sendMessage(msg.chat.id, upload.message);
            updateUserStats(userId);
        } else {
            await bot.sendMessage(msg.chat.id, `Upload failed: ${upload.message}`);
        }

        fs.unlinkSync(outputPath);

    } catch (error) {
        console.error('Error processing TikTok URL:', error);
        await bot.sendMessage(msg.chat.id, `An error occurred: ${error.message}`);
    }
}

bot.on(['/start', '/help'], (msg) => {
    const helpMessage = `
Welcome to TikTok Downloader Bot!

Commands:
/start or /help - Show this help message
/stats - Show your download statistics

To download a TikTok video, simply send the TikTok URL to the bot.

Note: You can download up to ${MAX_DOWNLOADS_PER_DAY} videos per day.
    `;
    return bot.sendMessage(msg.chat.id, helpMessage);
});

bot.on('/stats', (msg) => {
    const userId = msg.from.id;
    const stats = userStats.get(userId);
    if (stats) {
        return bot.sendMessage(msg.chat.id, `Today (${stats.date}) you've downloaded ${stats.count} videos.`);
    } else {
        return bot.sendMessage(msg.chat.id, "You haven't downloaded any videos today.");
    }
});

bot.on('text', async (msg) => {
    const body = msg.text;
    const tiktokRegex = /https?:\/\/(?:m|www|vm|vt)?\.?tiktok\.com\/\S+/;
    const match = body.match(tiktokRegex);

    if (match) {
        await handleTikTokUrl(msg, match[0]);
    }
});

bot.start();