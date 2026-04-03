import { useState, useEffect } from 'react'
import { Sun, Moon, Languages, Activity } from 'lucide-react'

// ── i18n ─────────────────────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'Bandwidth Calculator',
    subtitle: 'Unit conversion, transfer time, oversubscription ratio and 95th percentile estimation. Everything runs client-side.',
    // tabs
    tabConverter: 'Unit Converter',
    tabTransfer: 'Transfer Time',
    tabOversub: 'Oversubscription',
    tabPercentile: '95th Percentile',
    // unit converter
    converterTitle: 'Bandwidth Unit Converter',
    converterDesc: 'Convert between bits/s and bytes/s across all magnitudes',
    inputValue: 'Value',
    inputUnit: 'Unit',
    results: 'Results',
    bitsPerSec: 'Bits per second',
    bytesPerSec: 'Bytes per second',
    // transfer time
    transferTitle: 'Transfer Time Calculator',
    transferDesc: 'How long to transfer a file at a given bandwidth',
    fileSize: 'File Size',
    bandwidth: 'Bandwidth',
    transferTime: 'Transfer Time',
    days: 'days',
    hours: 'hours',
    minutes: 'minutes',
    seconds: 'seconds',
    // oversubscription
    oversubTitle: 'Oversubscription Calculator',
    oversubDesc: 'Total clients x plan speed vs uplink capacity',
    totalClients: 'Total Clients',
    planSpeed: 'Plan Speed (per client)',
    uplinkCapacity: 'Uplink Capacity',
    ratio: 'Oversubscription Ratio',
    ratioGood: 'Low contention — adequate capacity',
    ratioWarn: 'Moderate contention — monitor during peak',
    ratioBad: 'High contention — uplink likely saturated',
    totalDemand: 'Total Demand',
    // 95th percentile
    p95Title: '95th Percentile Estimator',
    p95Desc: 'Estimate peak bandwidth from average usage and burst factor',
    avgUsage: 'Average Usage',
    burstFactor: 'Burst Factor',
    burstFactorHint: 'Typical range: 1.5 (light) to 4.0 (heavy burst)',
    p95Result: 'Estimated 95th Percentile',
    p95Explain: 'The 95th percentile discards the top 5% of traffic samples. With a burst factor of {f}x, peak traffic is estimated at {p} above the average.',
    // footer
    builtBy: 'Built by',
  },
  pt: {
    title: 'Calculadora de Largura de Banda',
    subtitle: 'Conversao de unidades, tempo de transferencia, razao de oversubscription e estimativa do percentil 95. Tudo no navegador.',
    tabConverter: 'Conversor',
    tabTransfer: 'Tempo de Transferencia',
    tabOversub: 'Oversubscription',
    tabPercentile: 'Percentil 95',
    converterTitle: 'Conversor de Unidades de Banda',
    converterDesc: 'Converta entre bits/s e bytes/s em todas as magnitudes',
    inputValue: 'Valor',
    inputUnit: 'Unidade',
    results: 'Resultados',
    bitsPerSec: 'Bits por segundo',
    bytesPerSec: 'Bytes por segundo',
    transferTitle: 'Calculadora de Tempo de Transferencia',
    transferDesc: 'Quanto tempo para transferir um arquivo em uma dada largura de banda',
    fileSize: 'Tamanho do Arquivo',
    bandwidth: 'Largura de Banda',
    transferTime: 'Tempo de Transferencia',
    days: 'dias',
    hours: 'horas',
    minutes: 'minutos',
    seconds: 'segundos',
    oversubTitle: 'Calculadora de Oversubscription',
    oversubDesc: 'Total de clientes x velocidade do plano vs capacidade do uplink',
    totalClients: 'Total de Clientes',
    planSpeed: 'Velocidade do Plano (por cliente)',
    uplinkCapacity: 'Capacidade do Uplink',
    ratio: 'Razao de Oversubscription',
    ratioGood: 'Baixa contencao — capacidade adequada',
    ratioWarn: 'Contencao moderada — monitorar em horario de pico',
    ratioBad: 'Alta contencao — uplink provavelmente saturado',
    totalDemand: 'Demanda Total',
    p95Title: 'Estimador do Percentil 95',
    p95Desc: 'Estime o pico de banda a partir do uso medio e fator de rajada',
    avgUsage: 'Uso Medio',
    burstFactor: 'Fator de Rajada',
    burstFactorHint: 'Faixa tipica: 1.5 (leve) a 4.0 (rajada intensa)',
    p95Result: 'Percentil 95 Estimado',
    p95Explain: 'O percentil 95 descarta os 5% maiores picos de trafego. Com fator de rajada de {f}x, o pico estimado e {p} acima da media.',
    builtBy: 'Criado por',
  },
} as const

type Lang = keyof typeof translations

// ── Unit definitions ──────────────────────────────────────────────────────────
type BitUnit = 'Kbps' | 'Mbps' | 'Gbps' | 'Tbps'
type ByteUnit = 'KB/s' | 'MB/s' | 'GB/s' | 'TB/s'
type BwUnit = BitUnit | ByteUnit

const BIT_UNITS: BitUnit[] = ['Kbps', 'Mbps', 'Gbps', 'Tbps']
const BYTE_UNITS: ByteUnit[] = ['KB/s', 'MB/s', 'GB/s', 'TB/s']
const ALL_UNITS: BwUnit[] = [...BIT_UNITS, ...BYTE_UNITS]

// Factor to convert any unit to bits/s
const TO_BPS: Record<BwUnit, number> = {
  'Kbps': 1e3,
  'Mbps': 1e6,
  'Gbps': 1e9,
  'Tbps': 1e12,
  'KB/s': 8e3,
  'MB/s': 8e6,
  'GB/s': 8e9,
  'TB/s': 8e12,
}

function toBps(value: number, unit: BwUnit): number {
  return value * TO_BPS[unit]
}

function fromBps(bps: number, unit: BwUnit): number {
  return bps / TO_BPS[unit]
}

function fmtNum(n: number): string {
  if (n === 0) return '0'
  if (n >= 1e12) return (n / 1e12).toPrecision(6).replace(/\.?0+$/, '')
  if (n >= 1e9) return (n / 1e9).toPrecision(6).replace(/\.?0+$/, '')
  if (n >= 1e6) return (n / 1e6).toPrecision(6).replace(/\.?0+$/, '')
  if (n >= 1e3) return (n / 1e3).toPrecision(6).replace(/\.?0+$/, '')
  return n.toPrecision(6).replace(/\.?0+$/, '')
}

function fmtWithUnit(bps: number, unit: BwUnit): string {
  return `${fmtNum(fromBps(bps, unit))} ${unit}`
}

// File size units
type SizeUnit = 'KB' | 'MB' | 'GB' | 'TB'
const SIZE_UNITS: SizeUnit[] = ['KB', 'MB', 'GB', 'TB']
const SIZE_TO_BYTES: Record<SizeUnit, number> = {
  'KB': 1024,
  'MB': 1024 ** 2,
  'GB': 1024 ** 3,
  'TB': 1024 ** 4,
}

function toBytes(value: number, unit: SizeUnit): number {
  return value * SIZE_TO_BYTES[unit]
}

function calcTransferSeconds(fileSizeBytes: number, bps: number): number {
  if (bps <= 0) return 0
  // bps = bits/s, file is in bytes → multiply by 8
  return (fileSizeBytes * 8) / bps
}

type T = (typeof translations)[Lang]

function fmtDuration(totalSeconds: number, t: T): string {
  if (!isFinite(totalSeconds) || totalSeconds <= 0) return '—'
  const d = Math.floor(totalSeconds / 86400)
  const h = Math.floor((totalSeconds % 86400) / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.round(totalSeconds % 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d} ${t.days}`)
  if (h > 0) parts.push(`${h} ${t.hours}`)
  if (m > 0) parts.push(`${m} ${t.minutes}`)
  if (s > 0 || parts.length === 0) parts.push(`${s} ${t.seconds}`)
  return parts.join(' ')
}

// ── Shared UI pieces ──────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 ${className}`}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium mb-1.5">{children}</label>
}

function NumInput({ value, onChange, min = 0, step = 1, placeholder = '0' }: {
  value: string
  onChange: (v: string) => void
  min?: number
  step?: number | string
  placeholder?: string
}) {
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
    />
  )
}

function Select<T extends string>({ value, onChange, options }: {
  value: T
  onChange: (v: T) => void
  options: T[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold tabular-nums break-all">{value}</p>
    </div>
  )
}

// ── Tab: Unit Converter ───────────────────────────────────────────────────────
function UnitConverter({ t }: { t: T }) {
  const [rawValue, setRawValue] = useState('1')
  const [unit, setUnit] = useState<BwUnit>('Mbps')

  const value = parseFloat(rawValue) || 0
  const bps = toBps(value, unit)

  return (
    <Card>
      <h2 className="font-semibold">{t.converterTitle}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 mb-5">{t.converterDesc}</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <Label>{t.inputValue}</Label>
          <NumInput value={rawValue} onChange={setRawValue} min={0} step="any" placeholder="1" />
        </div>
        <div>
          <Label>{t.inputUnit}</Label>
          <Select value={unit} onChange={setUnit} options={ALL_UNITS} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{t.bitsPerSec}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BIT_UNITS.map(u => (
            <StatBox key={u} label={u} value={fmtWithUnit(bps, u)} />
          ))}
        </div>

        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mt-3">{t.bytesPerSec}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {BYTE_UNITS.map(u => (
            <StatBox key={u} label={u} value={fmtWithUnit(bps, u)} />
          ))}
        </div>
      </div>
    </Card>
  )
}

// ── Tab: Transfer Time ────────────────────────────────────────────────────────
function TransferTime({ t }: { t: T }) {
  const [fileVal, setFileVal] = useState('1')
  const [fileUnit, setFileUnit] = useState<SizeUnit>('GB')
  const [bwVal, setBwVal] = useState('100')
  const [bwUnit, setBwUnit] = useState<BwUnit>('Mbps')

  const fileSizeBytes = toBytes(parseFloat(fileVal) || 0, fileUnit)
  const bps = toBps(parseFloat(bwVal) || 0, bwUnit)
  const totalSec = calcTransferSeconds(fileSizeBytes, bps)
  const duration = fmtDuration(totalSec, t)

  return (
    <Card>
      <h2 className="font-semibold">{t.transferTitle}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 mb-5">{t.transferDesc}</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <Label>{t.fileSize}</Label>
          <div className="flex gap-2">
            <NumInput value={fileVal} onChange={setFileVal} min={0} step="any" placeholder="1" />
            <div className="shrink-0 w-28">
              <Select value={fileUnit} onChange={setFileUnit} options={SIZE_UNITS} />
            </div>
          </div>
        </div>
        <div>
          <Label>{t.bandwidth}</Label>
          <div className="flex gap-2">
            <NumInput value={bwVal} onChange={setBwVal} min={0} step="any" placeholder="100" />
            <div className="shrink-0 w-28">
              <Select value={bwUnit} onChange={setBwUnit} options={ALL_UNITS} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4 text-center">
        <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">{t.transferTime}</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{duration}</p>
      </div>

      {totalSec > 0 && (
        <div className="grid gap-2 sm:grid-cols-3 mt-4">
          <StatBox label={t.fileSize} value={`${parseFloat(fileVal) || 0} ${fileUnit}`} />
          <StatBox label={t.bandwidth} value={`${parseFloat(bwVal) || 0} ${bwUnit}`} />
          <StatBox label={t.transferTime} value={`${totalSec < 1 ? '< 1' : Math.round(totalSec)} s`} />
        </div>
      )}
    </Card>
  )
}

// ── Tab: Oversubscription ─────────────────────────────────────────────────────
function Oversubscription({ t }: { t: T }) {
  const [clients, setClients] = useState('100')
  const [planVal, setPlanVal] = useState('100')
  const [planUnit, setPlanUnit] = useState<BwUnit>('Mbps')
  const [uplinkVal, setUplinkVal] = useState('1')
  const [uplinkUnit, setUplinkUnit] = useState<BwUnit>('Gbps')

  const totalDemandBps = (parseFloat(clients) || 0) * toBps(parseFloat(planVal) || 0, planUnit)
  const uplinkBps = toBps(parseFloat(uplinkVal) || 0, uplinkUnit)
  const ratio = uplinkBps > 0 ? totalDemandBps / uplinkBps : 0

  const ratioColor =
    ratio <= 10 ? 'emerald' :
    ratio <= 20 ? 'yellow' :
    'red'

  const ratioLabel =
    ratio <= 10 ? t.ratioGood :
    ratio <= 20 ? t.ratioWarn :
    t.ratioBad

  const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: 'border-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    yellow:  { border: 'border-yellow-500',  bg: 'bg-yellow-50 dark:bg-yellow-900/20',   text: 'text-yellow-600 dark:text-yellow-400' },
    red:     { border: 'border-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600 dark:text-red-400' },
  }

  const cc = colorClasses[ratioColor]

  return (
    <Card>
      <h2 className="font-semibold">{t.oversubTitle}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 mb-5">{t.oversubDesc}</p>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div>
          <Label>{t.totalClients}</Label>
          <NumInput value={clients} onChange={setClients} min={1} step={1} placeholder="100" />
        </div>
        <div>
          <Label>{t.planSpeed}</Label>
          <div className="flex gap-2">
            <NumInput value={planVal} onChange={setPlanVal} min={0} step="any" placeholder="100" />
            <div className="shrink-0 w-28">
              <Select value={planUnit} onChange={setPlanUnit} options={ALL_UNITS} />
            </div>
          </div>
        </div>
        <div>
          <Label>{t.uplinkCapacity}</Label>
          <div className="flex gap-2">
            <NumInput value={uplinkVal} onChange={setUplinkVal} min={0} step="any" placeholder="1" />
            <div className="shrink-0 w-28">
              <Select value={uplinkUnit} onChange={setUplinkUnit} options={ALL_UNITS} />
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-xl border-2 ${cc.border} ${cc.bg} px-5 py-4 text-center mb-4`}>
        <p className={`text-xs uppercase tracking-wider ${cc.text} mb-1`}>{t.ratio}</p>
        <p className={`text-3xl font-bold ${cc.text} tabular-nums`}>
          {ratio > 0 ? `${ratio.toFixed(1)}:1` : '—'}
        </p>
        {ratio > 0 && <p className={`text-xs mt-1 ${cc.text}`}>{ratioLabel}</p>}
      </div>

      {totalDemandBps > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <StatBox label={t.totalDemand} value={fmtWithUnit(totalDemandBps, 'Gbps')} />
          <StatBox label={t.uplinkCapacity} value={fmtWithUnit(uplinkBps, 'Gbps')} />
        </div>
      )}
    </Card>
  )
}

// ── Tab: 95th Percentile ──────────────────────────────────────────────────────
function Percentile95({ t }: { t: T }) {
  const [avgVal, setAvgVal] = useState('500')
  const [avgUnit, setAvgUnit] = useState<BwUnit>('Mbps')
  const [burst, setBurst] = useState('2')

  const avgBps = toBps(parseFloat(avgVal) || 0, avgUnit)
  const burstFactor = Math.max(1, parseFloat(burst) || 1)
  const p95Bps = avgBps * burstFactor

  const pctAbove = ((burstFactor - 1) * 100).toFixed(0)

  const explain = t.p95Explain
    .replace('{f}', burstFactor.toFixed(1))
    .replace('{p}', `${pctAbove}%`)

  return (
    <Card>
      <h2 className="font-semibold">{t.p95Title}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 mb-5">{t.p95Desc}</p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <Label>{t.avgUsage}</Label>
          <div className="flex gap-2">
            <NumInput value={avgVal} onChange={setAvgVal} min={0} step="any" placeholder="500" />
            <div className="shrink-0 w-28">
              <Select value={avgUnit} onChange={setAvgUnit} options={ALL_UNITS} />
            </div>
          </div>
        </div>
        <div>
          <Label>{t.burstFactor}</Label>
          <NumInput value={burst} onChange={setBurst} min={1} step={0.1} placeholder="2" />
          <p className="text-[11px] text-zinc-400 mt-1">{t.burstFactorHint}</p>
        </div>
      </div>

      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4 text-center mb-4">
        <p className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">{t.p95Result}</p>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
          {p95Bps > 0 ? fmtWithUnit(p95Bps, avgUnit) : '—'}
        </p>
      </div>

      {p95Bps > 0 && (
        <>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-4">
            {BIT_UNITS.map(u => <StatBox key={u} label={u} value={fmtWithUnit(p95Bps, u)} />)}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5">
            {explain}
          </p>
        </>
      )}
    </Card>
  )
}

// ── Root Component ────────────────────────────────────────────────────────────
type Tab = 'converter' | 'transfer' | 'oversub' | 'percentile'

export default function BandwidthCalculator() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('pt') ? 'pt' : 'en'))
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [tab, setTab] = useState<Tab>('converter')

  const t = translations[lang]

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'converter',  label: t.tabConverter },
    { id: 'transfer',   label: t.tabTransfer },
    { id: 'oversub',    label: t.tabOversub },
    { id: 'percentile', label: t.tabPercentile },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Activity size={18} className="text-white" />
            </div>
            <span className="font-semibold">Bandwidth Calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(l => l === 'en' ? 'pt' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle language"
            >
              <Languages size={14} />
              {lang.toUpperCase()}
            </button>
            <button
              onClick={() => setDark(d => !d)}
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Toggle theme"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <a
              href="https://github.com/gmowses/bandwidth-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-6 py-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">{t.subtitle}</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-1">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex-1 min-w-fit rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === id
                    ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'converter'  && <UnitConverter t={t} />}
          {tab === 'transfer'   && <TransferTime t={t} />}
          {tab === 'oversub'    && <Oversubscription t={t} />}
          {tab === 'percentile' && <Percentile95 t={t} />}
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-zinc-400">
          <span>
            {t.builtBy}{' '}
            <a href="https://github.com/gmowses" className="text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 transition-colors">
              Gabriel Mowses
            </a>
          </span>
          <span>MIT License</span>
        </div>
      </footer>
    </div>
  )
}
