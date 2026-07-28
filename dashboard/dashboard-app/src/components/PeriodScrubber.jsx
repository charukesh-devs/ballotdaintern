import { useState, useEffect, useRef } from 'react'

/**
 * Optional play/scrub control for stepping the map through a list of
 * periods (years, quarters, etc). Not wired into every module — a module
 * opts in by rendering this itself and swapping which field the map's
 * `metric.getValue` reads. Kept generic (no hardcoded years) so any
 * module's period list works.
 */
export default function PeriodScrubber({ periods, period, onChange, label = 'Period' }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef(null)
  const idx = periods.indexOf(period)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onChange(prev => {
          const i = periods.indexOf(prev)
          return i < periods.length - 1 ? periods[i + 1] : periods[0]
        })
      }, 800)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, onChange, periods])

  return (
    <div className="a250-scrub">
      <div className="a250-scrub-inner">
        <span className="a250-scrub-label">{label}</span>
        <input
          type="range"
          min={0}
          max={periods.length - 1}
          step={1}
          value={idx}
          onChange={e => { setIsPlaying(false); onChange(periods[Number(e.target.value)]) }}
          className="a250-scrub-input"
        />
        <div className="a250-scrub-years">
          {periods.map(p => (
            <span key={p} className={`a250-scrub-year ${p === period ? 'active' : ''}`}>{p}</span>
          ))}
        </div>
        <button
          className="a250-scrub-play"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  )
}
