import { useState } from 'react'

type Unit = 'K' | 'C'

const FORMULAS = [
  { label: 'TC1', a: 1.41887, b: 1.02797 },
  { label: 'TC2', a: 1.340045, b: 1.021 },
]

function calcCorrected(rawInput: string, unit: Unit, a: number, b: number): number | null {
  const x = parseFloat(rawInput)
  if (isNaN(x) || rawInput.trim() === '') return null
  const xC = unit === 'K' ? x - 273.15 : x
  const yC = a + b * xC
  return unit === 'K' ? yC + 273.15 : yC
}

function formatValue(y: number, unit: Unit): string {
  return y.toFixed(4) + (unit === 'C' ? ' °C' : ' K')
}

function CalcColumn({
  formula,
  rawInput,
  unit,
  onInputChange,
  onUnitChange,
}: {
  formula: (typeof FORMULAS)[number]
  rawInput: string
  unit: Unit
  onInputChange: (v: string) => void
  onUnitChange: (u: Unit) => void
}) {
  const y = calcCorrected(rawInput, unit, formula.a, formula.b)
  const correctedDisplay = y !== null ? formatValue(y, unit) : '-'

  const unitLabel = unit === 'C' ? '°C' : 'K'
  const formulaStr =
    unit === 'C'
      ? 'y [' + unitLabel + '] = ' + formula.a + ' + ' + formula.b + ' * x [' + unitLabel + ']'
      : 'y [K] = (' + formula.a + ' + ' + formula.b + ' * (x [K] - 273.15)) + 273.15'

  return (
    <div
      style={{
        flex: 1,
        border: '1px solid #d1d5db',
        borderRadius: 8,
        padding: '1rem 1.25rem',
        minWidth: 240,
      }}
    >
      <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>{formula.label}</h3>

      <label style={{ display: 'block', marginBottom: 4, fontSize: '0.875rem' }}>
        熱電対の読み値
      </label>
      <input
        type="number"
        value={rawInput}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="例: 200"
        style={{
          width: '100%',
          padding: '0.4rem 0.6rem',
          border: '1px solid #9ca3af',
          borderRadius: 4,
          fontSize: '1rem',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.875rem', marginRight: 8 }}>単位:</span>
        {(['K', 'C'] as Unit[]).map((u) => (
          <label key={u} style={{ marginRight: 12, fontSize: '0.875rem', cursor: 'pointer' }}>
            <input
              type="radio"
              name={'unit-' + formula.label}
              value={u}
              checked={unit === u}
              onChange={() => onUnitChange(u)}
              style={{ marginRight: 4 }}
            />
            {u === 'C' ? '°C' : 'K'}
          </label>
        ))}
      </div>

      <div
        style={{
          background: '#f3f4f6',
          borderRadius: 6,
          padding: '0.6rem 0.8rem',
          marginBottom: '1rem',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>補正値</span>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 2 }}>
          {correctedDisplay}
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>
        補正式: {formulaStr}
      </div>
    </div>
  )
}

export default function TCalibrationApp() {
  const [inputs, setInputs] = useState(['', ''])
  const [units, setUnits] = useState<Unit[]>(['K', 'K'])

  const correctedValues = FORMULAS.map((f, i) =>
    calcCorrected(inputs[i], units[i], f.a, f.b)
  )

  const bothValid = correctedValues[0] !== null && correctedValues[1] !== null

  let averageDisplay = '-'
  if (bothValid) {
    const y0 = correctedValues[0] as number
    const y1 = correctedValues[1] as number
    const y0K = units[0] === 'C' ? y0 + 273.15 : y0
    const y1K = units[1] === 'C' ? y1 + 273.15 : y1
    const avgK = (y0K + y1K) / 2
    averageDisplay = avgK.toFixed(4) + ' K  /  ' + (avgK - 273.15).toFixed(4) + ' °C'
  }

  return (
    <div style={{ margin: '1.5rem 0' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {FORMULAS.map((f, i) => (
          <CalcColumn
            key={f.label}
            formula={f}
            rawInput={inputs[i]}
            unit={units[i]}
            onInputChange={(v) => {
              const next = [...inputs]
              next[i] = v
              setInputs(next)
            }}
            onUnitChange={(u) => {
              const next = [...units]
              next[i] = u
              setUnits(next)
            }}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: '1rem',
          border: '1px solid #d1d5db',
          borderRadius: 8,
          padding: '0.8rem 1.25rem',
          background: bothValid ? '#eff6ff' : '#f9fafb',
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>TC1・TC2 補正値の平均</span>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 2 }}>
          {averageDisplay}
        </div>
      </div>
    </div>
  )
}
