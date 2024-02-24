import { TiktokDL } from './lib/ttapi.js'
import { ReelsUpload } from './lib/browserHandler.js'
import axios from 'axios'
import ProgressBar from 'progress'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import readlineSync from 'readline-sync'

async function downloadAndUpload(url) {
  try {
    const result = await TiktokDL(url)
    const video = result.result.video[0]
    const namafile = result.result.id
    const caption = result.result.description

    if (fs.existsSync(path.resolve('download', `${namafile}.mp4`))) {
      console.log(`[ ${chalk.hex('#f12711')(namafile)} already downloaded! ] ===== [${chalk.hex('#7F7FD5')('skipped')}]`);
      // await ReelsUpload(namafile, caption)
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
          await ReelsUpload(namafile, caption)
        })
      })
    }
  } catch (err) {
    console.log(err)
  }
}

function processUrlList(filePath) {
  const urls = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const url of urls) {
    if (url) downloadAndUpload(url.trim());
  }
}

const choice = readlineSync.question('Do you want to enter a single URL or a list of URLs? (single/list): ');

if (choice.toLowerCase() === 'single') {
  const url = readlineSync.question('Enter the TikTok URL: ');
  downloadAndUpload(url);
} else if (choice.toLowerCase() === 'list') {
  const filePath = readlineSync.question('Enter the path to your list file: ');
  processUrlList(filePath);
} else {
  console.log('Invalid input. Please enter "single" or "list".');
}
