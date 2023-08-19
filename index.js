import { TiktokDL } from './lib/ttapi.js'
import { ReelsUpload } from './lib/browserHandler.js'
import axios from 'axios'
import ProgressBar from 'progress'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'

try {
  const url = "https://www.tiktok.com/@yochands/video/7268558318216449286?is_from_webapp=1&sender_device=pc" // ==> url tiktok yang mau di download
  const result = await TiktokDL(url) // ==> fungsi buat download vidio tiktok
  const video = result.result.video[0]
  const namafile = result.result.id
  const caption = result.result.description
  if (fs.existsSync(path.resolve('download', `${namafile}.mp4`))) {
    console.log(`[ ${chalk.hex('#f12711')(namafile)} already downloaded! ] ===== [${chalk.hex('#7F7FD5')('skipped')}]`);
    // await ReelsUpload(namafile, caption) // ==> ini function buat upload ke reels fb via puppeteer
  } else {
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
            await ReelsUpload(namafile, caption) // ==> ini function buat upload ke reels fb via puppeteer
          })
    })
  }
} catch (err) {
  console.log(err)
}
