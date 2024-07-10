import { TiktokDL } from './lib/ttapi.js'
import { ReelsUpload } from './lib/browserHandler.js'
import axios from 'axios'
import ProgressBar from 'progress'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import readlineSync from 'readline-sync'
import ffmpeg from 'fluent-ffmpeg'
import Queue from 'better-queue'

// Fungsi untuk memilih kualitas video
function chooseVideoQuality(videos) {
  console.log('Available video qualities:')
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.quality}`)
  })
  const choice = readlineSync.questionInt('Choose video quality (enter number): ', {
    min: 1,
    max: videos.length
  })
  return videos[choice - 1]
}

// Fungsi untuk menyimpan metadata
function saveMetadata(metadata, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2))
  console.log(`Metadata saved to ${filePath}`)
}

// Fungsi untuk mengonversi video
function convertVideo(inputPath, outputPath, format) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat(format)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

async function downloadAndUpload(url, retries = 3) {
  try {
    console.log(`Scrape data tiktok, Please wait..`)
    const result = await TiktokDL(url)
    const videos = result.result.video
    const video = chooseVideoQuality(videos)
    const namafile = result.result.id
    const caption = result.result.description
    const downloadPath = path.resolve('download', `${namafile}.mp4`)

    if (fs.existsSync(downloadPath)) {
      console.log(`[ ${chalk.hex('#f12711')(namafile)} already downloaded! ] ===== [${chalk.hex('#7F7FD5')('skipped')}]`)
    } else {
      await axios({
        url: video.url,
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
        const writer = fs.createWriteStream(downloadPath)
        data.pipe(writer)
        data.on('end', async () => {
          console.log(`Download completed: ${namafile}`)
          
          // Simpan metadata
          saveMetadata(result.result, path.resolve('download', `${namafile}_metadata.json`))
          
          // Konversi video (contoh ke format webm)
          const webmPath = path.resolve('download', `${namafile}.webm`)
          await convertVideo(downloadPath, webmPath, 'webm')
          console.log(`Video converted to WebM: ${webmPath}`)
          
          await ReelsUpload(namafile, caption)
        })
      })
    }
  } catch (err) {
    if (retries > 0) {
      console.log(`Error occurred. Retrying... (${retries} attempts left)`)
      await downloadAndUpload(url, retries - 1)
    } else {
      console.log(`Failed to process URL after multiple attempts: ${url}`)
      console.log(err)
    }
  }
}

// Implementasi sistem antrian
const downloadQueue = new Queue(async (task, cb) => {
  await downloadAndUpload(task.url)
  cb(null, task)
}, { concurrent: 2 })

function processUrlList(filePath) {
  const urls = fs.readFileSync(filePath, 'utf8').split('\n')
  for (const url of urls) {
    if (url) downloadQueue.push({ url: url.trim() })
  }
}

const choice = readlineSync.question('Do you want to enter a single URL or a list of URLs? (single/list): ')

if (choice.toLowerCase() === 'single') {
  const url = readlineSync.question('Enter the TikTok URL: ')
  downloadQueue.push({ url })
} else if (choice.toLowerCase() === 'list') {
  const filePath = readlineSync.question('Enter the path to your list file: ')
  processUrlList(filePath)
} else {
  console.log('Invalid input. Please enter "single" or "list".')
}
