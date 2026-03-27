import { formatCurrency, formatDate } from '@/lib/utils'
import type {
  NFeExtracted,
  BankStatementExtracted,
  ContractExtracted,
  DocumentFileType,
} from '@/types'

interface ExtractedDataViewProps {
  data: Record<string, unknown>
  fileType: DocumentFileType
}

export function ExtractedDataView({ data, fileType }: ExtractedDataViewProps) {
  if (fileType === 'nfe') {
    const nfe = data as unknown as NFeExtracted
    return (
      <div className="space-y-4">
        <Section title="Dados da Nota">
          <Row label="Número / Série" value={`${nfe.numero_nf} / ${nfe.serie}`} />
          <Row label="Data de Emissão" value={nfe.data_emissao ? formatDate(nfe.data_emissao) : '—'} />
          <Row label="Chave de Acesso" value={nfe.chave_acesso} mono />
        </Section>
        <Section title="Emitente">
          <Row label="Razão Social" value={nfe.razao_social_emitente} />
          <Row label="CNPJ" value={nfe.cnpj_emitente} />
        </Section>
        <Section title="Destinatário">
          <Row label="Razão Social" value={nfe.razao_social_destinatario} />
          <Row label="CNPJ" value={nfe.cnpj_destinatario} />
        </Section>
        <Section title="Valores">
          <Row label="Total" value={nfe.valor_total != null ? formatCurrency(nfe.valor_total) : '—'} bold />
          <Row label="ICMS" value={nfe.valor_icms != null ? formatCurrency(nfe.valor_icms) : '—'} />
          <Row label="IPI" value={nfe.valor_ipi != null ? formatCurrency(nfe.valor_ipi) : '—'} />
          <Row label="PIS" value={nfe.valor_pis != null ? formatCurrency(nfe.valor_pis) : '—'} />
          <Row label="COFINS" value={nfe.valor_cofins != null ? formatCurrency(nfe.valor_cofins) : '—'} />
        </Section>
        {nfe.itens?.length > 0 && (
          <Section title={`Itens (${nfe.itens.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Descrição</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Qtd</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Unit.</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {nfe.itens.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 text-gray-700">{item.descricao}</td>
                      <td className="py-2 text-right text-gray-600">{item.quantidade}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(item.valor_unitario)}</td>
                      <td className="py-2 text-right font-medium text-gray-900">{formatCurrency(item.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    )
  }

  if (fileType === 'bank_statement') {
    const stmt = data as unknown as BankStatementExtracted
    return (
      <div className="space-y-4">
        <Section title="Conta">
          <Row label="Banco" value={stmt.banco} />
          <Row label="Agência" value={stmt.agencia} />
          <Row label="Conta" value={stmt.conta} />
          <Row label="Período" value={stmt.periodo ? `${formatDate(stmt.periodo.inicio)} — ${formatDate(stmt.periodo.fim)}` : '—'} />
        </Section>
        <Section title="Saldos">
          <Row label="Saldo Inicial" value={stmt.saldo_inicial != null ? formatCurrency(stmt.saldo_inicial) : '—'} />
          <Row label="Saldo Final" value={stmt.saldo_final != null ? formatCurrency(stmt.saldo_final) : '—'} bold />
        </Section>
        {stmt.transacoes?.length > 0 && (
          <Section title={`Transações (${stmt.transacoes.length})`}>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Data</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Descrição</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {stmt.transacoes.map((t, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1.5 text-gray-600 whitespace-nowrap">{formatDate(t.data)}</td>
                      <td className="py-1.5 text-gray-700">{t.descricao}</td>
                      <td className={`py-1.5 text-right font-medium ${t.tipo === 'credito' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.tipo === 'credito' ? '+' : '-'}{formatCurrency(Math.abs(t.valor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    )
  }

  if (fileType === 'contract') {
    const contract = data as unknown as ContractExtracted
    return (
      <div className="space-y-4">
        <Section title="Contrato">
          <Row label="Tipo" value={contract.tipo_contrato} />
          <Row label="Objeto" value={contract.objeto} />
          <Row label="Valor Total" value={contract.valor_total != null ? formatCurrency(contract.valor_total) : '—'} bold />
          <Row label="Vigência" value={contract.data_inicio && contract.data_fim ? `${formatDate(contract.data_inicio)} — ${formatDate(contract.data_fim)}` : '—'} />
        </Section>
        {contract.partes?.length > 0 && (
          <Section title="Partes">
            {contract.partes.map((parte, i) => (
              <div key={i} className="mb-2 p-2 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700">{parte.papel}</p>
                <p className="text-xs text-gray-600">{parte.nome}</p>
                {parte.cnpj_cpf && <p className="text-xs text-gray-500">{parte.cnpj_cpf}</p>}
              </div>
            ))}
          </Section>
        )}
        {contract.clausulas_principais?.length > 0 && (
          <Section title="Cláusulas Principais">
            <ul className="space-y-1">
              {contract.clausulas_principais.map((c, i) => (
                <li key={i} className="text-xs text-gray-700 flex gap-2">
                  <span className="text-gray-400 shrink-0">{i + 1}.</span>
                  {c}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    )
  }

  // Generic fallback
  return (
    <Section title="Dados Extraídos">
      <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Section>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  bold,
  mono,
}: {
  label: string
  value: string | number | null | undefined
  bold?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-xs text-right break-all ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'} ${mono ? 'font-mono text-[10px]' : ''}`}
      >
        {value ?? '—'}
      </span>
    </div>
  )
}
