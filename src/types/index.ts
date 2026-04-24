export type UserRole = 'admin' | 'member'

export type DocumentFileType = 'nfe' | 'bank_statement' | 'contract' | 'other'
export type DocumentStatus = 'pending' | 'processing' | 'done' | 'error'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Document {
  id: string
  user_id: string
  file_name: string
  file_path: string
  file_type: DocumentFileType
  status: DocumentStatus
  extracted_data: NFeExtracted | BankStatementExtracted | ContractExtracted | null
  raw_text: string | null
  created_at: string
  updated_at: string
}

export interface Pop {
  id: string
  title: string
  description: string | null
  file_path: string | null
  content: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface PopChunk {
  id: string
  pop_id: string
  chunk_index: number
  content: string
  created_at: string
}

export interface RetrievedChunk {
  id: string
  pop_id: string
  pop_title: string
  content: string
  similarity: number
}

// Extraction schemas
export interface NFeExtracted {
  numero_nf: string
  serie: string
  data_emissao: string
  cnpj_emitente: string
  razao_social_emitente: string
  cnpj_destinatario: string
  razao_social_destinatario: string
  valor_total: number
  valor_icms: number
  valor_ipi: number
  valor_pis: number
  valor_cofins: number
  chave_acesso: string
  itens: Array<{
    descricao: string
    ncm: string
    quantidade: number
    valor_unitario: number
    valor_total: number
  }>
}

export interface BankStatementExtracted {
  banco: string
  agencia: string
  conta: string
  periodo: { inicio: string; fim: string }
  saldo_inicial: number
  saldo_final: number
  transacoes: Array<{
    data: string
    descricao: string
    valor: number
    tipo: 'credito' | 'debito'
  }>
}

export interface ContractExtracted {
  tipo_contrato: string
  partes: Array<{ nome: string; cnpj_cpf: string; papel: string }>
  objeto: string
  valor_total: number
  data_inicio: string
  data_fim: string
  clausulas_principais: string[]
}
