import { TiktokDL } from './lib/ttapi.js'
import { ReelsUpload } from './lib/browserHandler.js'
import data from './config.json' assert {type: 'json'};;
import TeleBot from 'telebot';
import axios from 'axios'
import ProgressBar from 'progress'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'

const bot = new TeleBot({
    token: data.tokenBOT
});

bot.on('text', async (msg) => {
    const body = msg.text
    const isTiktokDetected = body.includes("tiktok.com") || body.includes("https://vt.") || body.includes("https://vm.")
    if (isTiktokDetected) {
        const regex = /https?:\/\/(?:m|www|vm|vt)?\.?tiktok\.com\/\S+/;
        const isTiktokURL = body.match(regex)[0];
        console.log(isTiktokURL)
        const result = await TiktokDL(isTiktokURL) // ==> fungsi buat download vidio tiktok
        const video = result.result.video[0]
        const namafile = result.result.id
        const caption = result.result.description
        await bot.sendMessage(msg.chat.id, "Proses...", { replyToMessage : msg.message_id });
        await axios({
            url: video,
            method: 'GET',
            responseType: 'stream'
        }).then(async ({ data, headers }) => {
        if (!fs.existsSync('download')) fs.mkdirSync('download')
            const totalLength = headers['content-length']
            const progressBar = new ProgressBar(`[ ${chalk.hex('#ffff1c')("Proses Download")} ] [${chalk.hex('#6be585')(':bar')}] :percent downloaded in :elapseds`, {
                width: 40,
                complete: '<',
                incomplete: '•',
                renderThrottle: 1,
                total: parseInt(totalLength)
            })
            data.on('data', (chunk) => {
                progressBar.tick(chunk.length)
            })
            const writer = fs.createWriteStream(path.resolve('download', `${namafile}.mp4`))
            data.pipe(writer)
            data.on('end', async () => {
                var upload = await ReelsUpload(namafile, caption)
                if (upload.status == "success") {
                    return bot.sendMessage(msg.chat.id, `${upload.message}`);
                } else {
                    return bot.sendMessage(msg.chat.id, upload.message);
                }
            })
        })
        // var upload = await videoPageUpload(namafile, caption)
        // if (upload.status == "success") {
        //     console.log('Success')
        //     return bot.sendMessage(msg.chat.id, `${upload.message}`);
        // } else {
        //     await bot.sendMessage(msg.chat.id, upload.message);
        //     return bot.sendMessage(msg.chat.id, `Video Gagal di publish!`);
        // }
    }
});

bot.start();