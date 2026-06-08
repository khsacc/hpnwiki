import { useState } from 'react'

type Unit = 'K' | 'C'

const FORMULAS = [
  { label: 'TC1', a: 1.41887, b: 1.02797 },
  { label: 'TC2', a: 1.340045, b: 1.021 },
]

function CalcColumn({ formula }: { formula: (typeof FORMULAS)[number] }) {
  const [rawInput, setRawInput] = useState('')
  const [unit, setUnit] = useState<Unit>('K')

  const x = parseFloat(rawInput)
  const valid = !isNaN(x) && rawInput.trim() !== ''

  let correctedDisplay = '-'
  if (valid) {
    const xC = unit === 'K' ? x - 273.15 : x
    const yC = formula.a + formula.b * xC
    const y = unit === 'K' ? yC + 273.15 : yC
    correctedDisplay = String(y.toFixed(4)) + (unit === 'C' ? ' °C' : ' K')
  }

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
        onChange={(e) => setRawInput(e.target.value)}
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
              onChange={() => setUnit(u)}
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
  return (
    <div style={{ margin: '1.5rem 0' }}>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {FORMULAS.map((f) => (
          <CalcColumn key={f.label} formula={f} />
        ))}
      </div>
    </div>
  )
}
