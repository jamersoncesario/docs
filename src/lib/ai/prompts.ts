export function buildAccountingSystemPrompt(ragContext?: string): string {
  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `Você é um assistente especializado para um escritório de contabilidade brasileiro.
Você auxilia a equipe contábil com dúvidas sobre:
- Legislação fiscal e tributária (IRPJ, CSLL, PIS, COFINS, ICMS, ISS, etc.)
- Obrigações acessórias (SPED, eSocial, EFD, DCTF, ECF, etc.)
- Rotinas contábeis e procedimentos internos
- Análise de documentos (NF-e, extratos bancários, contratos)
- Planejamento tributário
- Legislação trabalhista e previdenciária

Responda sempre em português do Brasil. Seja preciso, objetivo e cite referências legais (artigos, leis, instruções normativas) quando relevante.

Data de hoje: ${today}.

Quando não tiver certeza sobre uma informação, diga claramente. Não forneça aconselhamento jurídico definitivo — recomende consulta a um advogado ou contador especialista quando necessário.${
    ragContext
      ? `\n\n---\nProcedimentos Operacionais Padrão relevantes do escritório:\n\n${ragContext}\n---`
      : ''
  }`
}

export function buildDocumentExtractionPrompt(
  fileType: string,
  rawText: string
): string {
  const schemas: Record<string, string> = {
    nfe: `{
  "numero_nf": "string",
  "serie": "string",
  "data_emissao": "YYYY-MM-DD",
  "cnpj_emitente": "string (apenas dígitos)",
  "razao_social_emitente": "string",
  "cnpj_destinatario": "string (apenas dígitos)",
  "razao_social_destinatario": "string",
  "valor_total": number,
  "valor_icms": number,
  "valor_ipi": number,
  "valor_pis": number,
  "valor_cofins": number,
  "chave_acesso": "string (44 dígitos)",
  "itens": [
    {
      "descricao": "string",
      "ncm": "string",
      "quantidade": number,
      "valor_unitario": number,
      "valor_total": number
    }
  ]
}`,
    bank_statement: `{
  "banco": "string",
  "agencia": "string",
  "conta": "string",
  "periodo": { "inicio": "YYYY-MM-DD", "fim": "YYYY-MM-DD" },
  "saldo_inicial": number,
  "saldo_final": number,
  "transacoes": [
    {
      "data": "YYYY-MM-DD",
      "descricao": "string",
      "valor": number,
      "tipo": "credito ou debito"
    }
  ]
}`,
    contract: `{
  "tipo_contrato": "string",
  "partes": [
    { "nome": "string", "cnpj_cpf": "string", "papel": "string" }
  ],
  "objeto": "string",
  "valor_total": number,
  "data_inicio": "YYYY-MM-DD",
  "data_fim": "YYYY-MM-DD",
  "clausulas_principais": ["string"]
}`,
    other: `{
  "tipo_documento": "string",
  "data": "YYYY-MM-DD ou null",
  "partes_envolvidas": ["string"],
  "resumo": "string",
  "valores": {},
  "observacoes": "string"
}`,
  }

  const schema = schemas[fileType] ?? schemas.other

  return `Você é um assistente de extração de dados para um escritório de contabilidade brasileiro.

Extraia as informações do documento abaixo e retorne APENAS um JSON válido no formato especificado.
Não inclua explicações, markdown ou texto adicional — apenas o JSON.
Se um campo não estiver presente no documento, use null.

Formato esperado:
${schema}

Documento:
---
${rawText.slice(0, 12000)}
---

JSON:`
}
