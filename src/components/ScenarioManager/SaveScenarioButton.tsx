import { useState, useCallback } from 'react'

interface SaveScenarioButtonProps {
  onSave: (name: string) => void
}

function SaveScenarioButton({ onSave }: SaveScenarioButtonProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')

  const handleSave = useCallback(() => {
    const trimmed = name.trim()
    if (!trimmed) return
    onSave(trimmed)
    setName('')
    setEditing(false)
  }, [name, onSave])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
      if (e.key === 'Escape') { setEditing(false); setName('') }
    },
    [handleSave]
  )

  if (!editing) {
    return (
      <button
        className="btn-primary"
        onClick={() => setEditing(true)}
        type="button"
      >
        Save Scenario
      </button>
    )
  }

  return (
    <div className="save-scenario-inline">
      <input
        type="text"
        className="save-scenario-input"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Scenario name"
        autoFocus
      />
      <button
        className="save-scenario-confirm"
        onClick={handleSave}
        type="button"
        disabled={!name.trim()}
      >
        Save
      </button>
      <button
        className="save-scenario-cancel"
        onClick={() => { setEditing(false); setName('') }}
        type="button"
      >
        &times;
      </button>
    </div>
  )
}

export default SaveScenarioButton
