import type { Profile } from '../../types'

interface ProfileSelectorProps {
  profiles: Profile[]
  selectedProfileId: string
  onSelect: (profileId: string) => void
}

function ProfileSelector({ profiles, selectedProfileId, onSelect }: ProfileSelectorProps) {
  return (
    <div className="profile-selector">
      <label htmlFor="consumption-profile">Consumption Profile</label>
      <select
        id="consumption-profile"
        value={selectedProfileId}
        onChange={(e) => onSelect(e.target.value)}
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ProfileSelector
