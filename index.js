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
  if (!videos || videos.length === 0) {
    console.log('No video qualities available. Using default.');
    return videos[0];
  }

  console.log('Available video qualities:')
  videos.forEach((video, index) => {
    console.log(`${index + 1}. ${video.quality || 'Unknown quality'}`)
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
    console.log(`Scraping data from TikTok, please wait...`)
    const result = await TiktokDL(url)
    console.log('TiktokDL result:', JSON.stringify(result, null, 2));

    if (!result.result || !result.result.video || result.result.video.length === 0) {
      console.log('No video data available. Please check the URL or try again.');
      return;
    }

    const video = chooseVideoQuality(result.result.video)
    if (!video || !video.url) {
      console.log('Invalid video data. Please check the URL or try again.');
      return;
    }

    const namafile = result.result.id || 'unknown'
    const caption = result.result.description || ''
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
        const progressBar = new ProgressBar(`[ ${chalk.hex('#ffff1c')("Downloading")} ] [${chalk.hex('#6be585')(':bar')}] :percent in :elapseds`, {
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
          
          // Save metadata
          saveMetadata(result.result, path.resolve('download', `${namafile}_metadata.json`))
          
          // Convert video (example to webm format)
          const webmPath = path.resolve('download', `${namafile}.webm`)
          try {
            await convertVideo(downloadPath, webmPath, 'webm')
            console.log(`Video converted to WebM: ${webmPath}`)
          } catch (error) {
            console.log(`Error converting video: ${error.message}`)
          }
          
          try {
            await ReelsUpload(namafile, caption)
            console.log(`Video uploaded successfully: ${namafile}`)
          } catch (error) {
            console.log(`Error uploading video: ${error.message}`)
          }
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
    if (url.trim()) downloadQueue.push({ url: url.trim() })
  }
}

console.log(chalk.blue('TikTok Downloader and Uploader'))
console.log(chalk.green('================================'))

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

downloadQueue.on('drain', () => {
  console.log(chalk.green('All tasks completed!'))
})