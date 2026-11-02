/** Modal picker listing profiles from the built-in library. */

import { useCallback } from 'react'

interface LibraryItem {
  id: string
  name: string
}

interface LibraryPickerProps {
  title: string
  items: readonly LibraryItem[]
  onSelect: (id: string) => void
  onClose: () => void
}

export function LibraryPicker({ title, items, onSelect, onClose }: LibraryPickerProps) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id)
      onClose()
    },
    [onSelect, onClose],
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-card__header">
          <h3>{title}</h3>
          <button className="modal-card__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <ul className="library-list" data-testid="library-list">
          {items.map((item) => (
            <li key={item.id}>
              <button
                className="library-list__item"
                onClick={() => handleSelect(item.id)}
                data-profile-id={item.id}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
