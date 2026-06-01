import { addStudent, removeStudent, getAllStudents, getCount } from './whitelist.js'
import { clearHistory, getActiveConversations } from './ai.js'

export async function handleAdminCommand(bot, msg, text) {
  const chatId = msg.chat.id
  const parts = text.replace('/admin', '').trim().split(' ')
  const cmd = parts[0]?.toLowerCase()
  const args = parts.slice(1)

  if (!cmd || cmd === 'help') {
    await bot.sendMessage(chatId, `*🔐 Peaceable Admin Commands*

*Student Management:*
/admin add [number] [country] — Add a student
/admin remove [number] — Remove a student
/admin list — See all approved students
/admin count — Total numbers

*Bot Management:*
/admin stats — Bot statistics
/admin clear [number] — Reset a student conversation

*Examples:*
/admin add 2348012345678 Nigeria
/admin remove 2348012345678`, { parse_mode: 'Markdown' })
    return
  }

  if (cmd === 'add') {
    const number = args[0]?.replace(/\D/g, '')
    const country = args[1] || 'Unknown'
    if (!number) {
      await bot.sendMessage(chatId, '⚠️ Usage: /admin add [number] [country]')
      return
    }
    addStudent(number, 'YSJ', country)
    await bot.sendMessage(chatId, `✅ *Student added!*\n\n📱 Number: ${number}\n🌍 Country: ${country}`, { parse_mode: 'Markdown' })
    return
  }

  if (cmd === 'remove') {
    const number = args[0]?.replace(/\D/g, '')
    if (!number) {
      await bot.sendMessage(chatId, '⚠️ Usage: /admin remove [number]')
      return
    }
    const removed = removeStudent(number)
    clearHistory(number)
    await bot.sendMessage(chatId, removed ? `✅ Student *${number}* removed.` : `⚠️ Number *${number}* not found.`, { parse_mode: 'Markdown' })
    return
  }

  if (cmd === 'list') {
    const students = getAllStudents()
    const entries = Object.entries(students)
    if (entries.length === 0) {
      await bot.sendMessage(chatId, '📋 No approved students yet.\n\nUse /admin add [number] [country] to add one.')
      return
    }
    const lines = entries.map(([num, info], i) => `${i + 1}. +${num} — ${info.country}`)
    await bot.sendMessage(chatId, `*📋 Approved Students (${entries.length})*\n\n${lines.join('\n')}`, { parse_mode: 'Markdown' })
    return
  }

  if (cmd === 'count') {
    const approved = getCount()
    const active = getActiveConversations()
    await bot.sendMessage(chatId, `*📊 Numbers*\n\n✅ Approved students: ${approved}\n💬 Active conversations: ${active}`, { parse_mode: 'Markdown' })
    return
  }

  if (cmd === 'stats') {
    const approved = getCount()
    const active = getActiveConversations()
    await bot.sendMessage(chatId, `*📊 Peaceable Stats*\n\n✅ Approved students: ${approved}\n💬 Active conversations: ${active}\n🤖 Bot status: Running ✅`, { parse_mode: 'Markdown' })
    return
  }

  if (cmd === 'clear') {
    const number = args[0]?.replace(/\D/g, '')
    if (!number) {
      await bot.sendMessage(chatId, '⚠️ Usage: /admin clear [number]')
      return
    }
    clearHistory(number)
    await bot.sendMessage(chatId, `✅ Conversation cleared for *${number}*`, { parse_mode: 'Markdown' })
    return
  }

  await bot.sendMessage(chatId, '❓ Unknown command. Type /admin help to see all commands.')
}
