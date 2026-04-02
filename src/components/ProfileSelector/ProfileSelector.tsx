import type { Profile } from '../../types'

interface ProfileSelectorProps {
  profiles: Profile[]
  selectedProfileId: string
  onSelect: (profileId: string) => void
  onUploadClick?: () => void
  onRemoveCustom?: (id: string) => void
  customProfileIds?: string[]
}

function ProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
  onUploadClick,
  onRemoveCustom,
  customProfileIds = [],
}: ProfileSelectorProps) {
  const builtIn = profiles.filter((p) => !customProfileIds.includes(p.id))
  const custom = profiles.filter((p) => customProfileIds.includes(p.id))
  const selectedIsCustom = customProfileIds.includes(selectedProfileId)

  return (
    <div className="profile-selector">
      <label htmlFor="consumption-profile">Consumption Profile</label>
      <div className="profile-selector-row">
        <select
          id="consumption-profile"
          value={selectedProfileId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {builtIn.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.name}
            </option>
          ))}
          {custom.length > 0 && (
            <optgroup label="Custom uploads">
              {custom.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {selectedIsCustom && onRemoveCustom && (
          <button
            className="slider-remove"
            onClick={() => onRemoveCustom(selectedProfileId)}
            aria-label="Remove custom profile"
            type="button"
          >
            &times;
          </button>
        )}
      </div>
      {onUploadClick && (
        <button className="upload-csv-btn" onClick={onUploadClick} type="button">
          Upload custom CSV
        </button>
      )}
    </div>
  )
}

export default ProfileSelector
