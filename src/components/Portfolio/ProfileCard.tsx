import type { PortfolioProfile } from '../../types'

interface ProfileCardProps {
  profile: PortfolioProfile
  onRemove: () => void
}

function formatRange(timestamps: number[]): string {
  if (timestamps.length === 0) return 'No data'
  const start = new Date(timestamps[0]).toISOString().slice(0, 10)
  const end = new Date(timestamps[timestamps.length - 1]).toISOString().slice(0, 10)
  return `${start} — ${end}`
}

function formatTotalMWh(values: number[]): string {
  const total = values.reduce((a, b) => a + b, 0)
  if (total >= 1000) return `${(total / 1000).toFixed(1)} GWh`
  return `${total.toFixed(1)} MWh`
}

function ProfileCard({ profile, onRemove }: ProfileCardProps) {
  const { timeSeries } = profile
  const dataPoints = timeSeries.values.length

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <span className="profile-card-name">{profile.name}</span>
        <button
          className="profile-card-remove"
          onClick={onRemove}
          aria-label={`Remove ${profile.name}`}
          type="button"
        >
          &times;
        </button>
      </div>
      <div className="profile-card-stats">
        <span className="profile-card-stat">
          {formatTotalMWh(timeSeries.values)}
        </span>
        <span className="profile-card-stat">
          {timeSeries.resolution}
        </span>
        <span className="profile-card-stat">
          {dataPoints.toLocaleString()} points
        </span>
      </div>
      <span className="profile-card-range">{formatRange(timeSeries.timestamps)}</span>
    </div>
  )
}

export default ProfileCard
