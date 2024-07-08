# tiktok-src

Tiktok downloader & auto upload to Facebook Reels (using Puppeteer).

## Features

- Download videos from TikTok
- Automatically upload videos to Facebook Reels
- Optional Telegram Bot integration for ease of use

## Installation

### Prerequisites

1. Access to the Facebook web interface (please ensure you are logged in).
2. Chrome browser extension ["Export cookies JSON file for Puppeteer"](https://chrome.google.com/webstore/detail/%E3%82%AF%E3%83%83%E3%82%AD%E3%83%BCjson%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%87%BA%E5%8A%9B-for-puppet/nmckokihipjgplolmcmjakknndddifde) installed.

### Steps

1. **Export Facebook Cookies:**

   - Login to your Facebook account using Chrome.
   - Use the ["Export cookies JSON file for Puppeteer"](https://chrome.google.com/webstore/detail/%E3%82%AF%E3%83%83%E3%82%AD%E3%83%BCjson%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%87%BA%E5%8A%9B-for-puppet/nmckokihipjgplolmcmjakknndddifde) extension to export your cookies.

2. **Clone this Repository:**

   ```bash
   git clone https://github.com/wahdalo/tiktok-src
   cd tiktok-src
   ```

3. **Replace cookies.json**

   - Replace the `cookies.json` file in the root directory with the exported file from the extension.

4. **Install Dependencies:**

   ```bash
   npm install
   ```

5. **Run the Script:**

   ```bash
   node index.js
   ```

6. **Input TikTok Video Link:**
   - Paste the TikTok video link when prompted.
     <img width="338" alt="image" src="https://github.com/dinarsanjaya/tiktok-src/assets/34889287/10efe135-4183-48d8-b801-9aa9fce25750" align="center">

### Telegram Bot feature (Optional)

1. **Create a Telegram Bot:**

   - Create a bot in ["BotFather"](https://t.me/BotFather).
   - Copy the token from BotFather into the `config.json` file.

2. **Run the Bot:**

   ```bash
    node telebot.js
   ```

3. **Paste TikTok Video URL:**
   - Paste your TikTok video URL into the Telegram bot that you have created.
     <img width="338" alt="image" src="https://github.com/wahdalo/tiktok-src/assets/50321468/70ddc312-f66b-4a60-a134-388f43c9e0ca" align="center">

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add awesome feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Create a new Pull Request

## Powered by TEA 
LIVE ON [TEA](https://app.tea.xyz/)
<img src="https://i.imgur.com/pE8oOUZ.png" align="center"/>