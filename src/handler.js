import { ADMIN_TELEGRAM_ID, GREETING } from './config.js'
import { askClaude } from './ai.js'
import { handleAdminCommand } from './admin.js'
import { isApproved } from './whitelist.js'

const greeted = new Set()

export async function handleMessage(bot, msg) {
  const chatId = msg.chat.id
  const userId = String(msg.from.id)
  const text = msg.text?.trim()

  if (!text) return

  console.log(`[${userId}]: ${text}`)

  const isAdmin = userId === ADMIN_TELEGRAM_ID

  // Admin commands
  if (isAdmin && text.startsWith('/admin')) {
    await handleAdminCommand(bot, msg, text)
    return
  }

  // Whitelist check — ignore unapproved users silently
  if (!isAdmin && !(await isApproved(userId))) {
    console.log(`Ignored unapproved user: ${userId}`)
    return
  }

  // Show typing indicator
  await bot.sendChatAction(chatId, 'typing')

  // Greet new students once per session
  if (!greeted.has(userId)) {
    greeted.add(userId)
    await bot.sendMessage(chatId, GREETING, { parse_mode: 'Markdown' })
    return
  }

  // Get AI reply
  const reply = await askClaude(userId, text)

  await bot.sendChatAction(chatId, 'typing')
  await bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' })
}
