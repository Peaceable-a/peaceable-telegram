import { GoogleGenerativeAI } from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT } from './knowledge.js'
import { FALLBACK_MESSAGE } from './config.js'

const conversations = new Map()
const MAX_HISTORY = 20

// Try Gemini first (free), fall back to Claude
async function getReply(history, message) {
  // Try Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      })
      const chat = model.startChat({ history: history.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))})
      const result = await chat.sendMessage(message)
      console.log('Using Gemini')
      return result.response.text()
    } catch (err) {
      console.log('Gemini failed:', err.message.slice(0, 80))
    }
  }

  // Fall back to Claude
  if (process.env.ANTHROPIC_API_KEY) {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history.concat([{ role: 'user', content: message }]),
    })
    console.log('Using Claude')
    return response.content[0].text
  }

  return FALLBACK_MESSAGE
}

export async function askClaude(userId, studentMessage) {
  try {
    if (!conversations.has(userId)) conversations.set(userId, [])
    const history = conversations.get(userId)

    const reply = await getReply(history, studentMessage)

    history.push({ role: 'user', content: studentMessage })
    history.push({ role: 'assistant', content: reply })

    if (history.length > MAX_HISTORY) {
      history.splice(0, history.length - MAX_HISTORY)
    }

    return reply
  } catch (err) {
    console.error('AI error:', err.message)
    return FALLBACK_MESSAGE
  }
}

export function clearHistory(userId) { conversations.delete(userId) }
export function getActiveConversations() { return conversations.size }
