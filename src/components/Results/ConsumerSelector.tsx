import type { PortfolioProfile } from '../../types'

interface ConsumerSelectorProps {
  consumers: PortfolioProfile[]
  selectedId: string | null
  onSelect: (id: string) => void
}

function ConsumerSelector({ consumers, selectedId, onSelect }: ConsumerSelectorProps) {
  if (consumers.length === 0) return null

  return (
    <div className="consumer-selector">
      <label htmlFor="consumer-select">Consumer</label>
      <select
        id="consumer-select"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        {consumers.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}

export default ConsumerSelector
