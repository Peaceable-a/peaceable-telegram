import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api'
import { handleMessage } from './src/handler.js'

const TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN is missing from .env')
  process.exit(1)
}

const bot = new TelegramBot(TOKEN, { polling: true })

console.log("Peaceable's Assistant is online on Telegram! 🚀")

bot.on('message', async (msg) => {
  try {
    await handleMessage(bot, msg)
  } catch (err) {
    console.error('Error handling message:', err.message)
  }
})

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught:', err.message)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled:', err?.message || err)
})
