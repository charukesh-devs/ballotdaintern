import { useState, useEffect, useRef } from 'react'

const YEARS = ['2020', '2021', '2022', '2023']

export default function YearScrubber({ year, onChange }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const intervalRef = useRef(null)
  const idx = YEARS.indexOf(year)

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        onChange(prev => {
          const i = YEARS.indexOf(prev)
          return i < YEARS.length - 1 ? YEARS[i + 1] : YEARS[0]
        })
      }, 800)
    }
    return () => clearInterval(intervalRef.current)
  }, [isPlaying, onChange])

  return (
    <div className="a250-scrub">
      <div className="a250-scrub-inner">
        <span className="a250-scrub-label">Year</span>
        <input
          type="range"
          min={0}
          max={YEARS.length - 1}
          step={1}
          value={idx}
          onChange={e => { setIsPlaying(false); onChange(YEARS[Number(e.target.value)]) }}
          className="a250-scrub-input"
        />
        <div className="a250-scrub-years">
          {YEARS.map(y => (
            <span key={y} className={`a250-scrub-year ${y === year ? 'active' : ''}`}>{y}</span>
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
