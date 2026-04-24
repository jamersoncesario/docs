const BASE_URL = process.env.EVOLUTION_API_URL!
const API_KEY = process.env.EVOLUTION_API_KEY!

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: API_KEY,
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...(options?.headers ?? {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Evolution API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export interface EvolutionInstance {
  instanceName: string
  status: string
  qrcode?: { base64?: string; code?: string }
  connectionStatus?: string
}

export async function createInstance(instanceName: string): Promise<{ instance: EvolutionInstance }> {
  return request('/instance/create', {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
    }),
  })
}

export async function fetchInstance(instanceName: string): Promise<EvolutionInstance> {
  const data = await request<EvolutionInstance[]>(
    `/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`
  )
  return Array.isArray(data) ? data[0] : (data as EvolutionInstance)
}

export async function getQrCode(
  instanceName: string
): Promise<{ base64?: string; code?: string } | null> {
  try {
    const data = await request<{ base64?: string; code?: string }>(
      `/instance/connect/${encodeURIComponent(instanceName)}`
    )
    return data
  } catch {
    return null
  }
}

export async function sendTextMessage(
  instanceName: string,
  number: string,
  text: string
): Promise<void> {
  await request(`/message/sendText/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    body: JSON.stringify({ number, text }),
  })
}

export async function deleteInstance(instanceName: string): Promise<void> {
  await request(`/instance/delete/${encodeURIComponent(instanceName)}`, {
    method: 'DELETE',
  })
}

export async function setWebhook(instanceName: string, webhookUrl: string): Promise<void> {
  await request(`/webhook/set/${encodeURIComponent(instanceName)}`, {
    method: 'POST',
    body: JSON.stringify({
      url: webhookUrl,
      enabled: true,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'QRCODE_UPDATED'],
    }),
  })
}
