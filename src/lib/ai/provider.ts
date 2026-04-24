import OpenAI from 'openai'
import { anthropic, CLAUDE_MODEL } from './anthropic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const WHATSAPP_SYSTEM_PROMPT = `Você é o atendente virtual da PRIME CONECT, um escritório de contabilidade digital brasileiro.
Responda sempre em português do Brasil, de forma cordial, objetiva e profissional.
Limite suas respostas a no máximo 250 caracteres para adequação ao WhatsApp.
Para assuntos complexos como planejamento tributário, diga que um contador irá retornar em breve.
Não forneça valores ou datas específicas sem confirmação com a equipe.
Data de hoje: ${new Date().toLocaleDateString('pt-BR')}.`

export async function generateWhatsAppReply(
  message: string,
  contactName?: string
): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? 'openai'

  const userContent = contactName
    ? `[Contato: ${contactName}] ${message}`
    : message

  if (provider === 'anthropic') {
    // Claude path — ready for future use
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 150,
      system: WHATSAPP_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  }

  // Default: OpenAI GPT-4o
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 150,
    messages: [
      { role: 'system', content: WHATSAPP_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  })
  return completion.choices[0]?.message?.content ?? ''
}
