/** Dropdown selector: "Whole portfolio" or an individual consumer. */

interface ConsumerOption {
  id: string
  name: string
}

interface ConsumerSelectorProps {
  consumers: readonly ConsumerOption[]
  selectedId: string | null
  onChange: (consumerId: string | null) => void
}

export function ConsumerSelector({ consumers, selectedId, onChange }: ConsumerSelectorProps) {
  return (
    <select
      className="consumer-selector"
      data-testid="consumer-selector"
      value={selectedId ?? '__portfolio__'}
      onChange={(e) => onChange(e.target.value === '__portfolio__' ? null : e.target.value)}
    >
      <option value="__portfolio__">Whole portfolio</option>
      {consumers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
