import { anthropic, CLAUDE_MODEL } from '@/lib/ai/anthropic'
import { buildDocumentExtractionPrompt } from '@/lib/ai/prompts'
import type { DocumentFileType } from '@/types'

export async function extractDocumentData(
  rawText: string,
  fileType: DocumentFileType
): Promise<Record<string, unknown>> {
  const prompt = buildDocumentExtractionPrompt(fileType, rawText)

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = message.content.find((c) => c.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const jsonText = textContent.text.trim()

  try {
    return JSON.parse(jsonText)
  } catch {
    // Try to extract JSON from the response if it has surrounding text
    const match = jsonText.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('Failed to parse extraction response as JSON')
  }
}
