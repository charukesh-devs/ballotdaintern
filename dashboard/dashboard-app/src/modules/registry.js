// ─────────────────────────────────────────────────────────────────────────
// Module registry
//
// This is the ONLY file you edit to add a new data module to the dashboard.
// 1. Drop your per-state JSON in public/your-data.json
// 2. Copy modules/economy.js as a starting template and fill in your fields
// 3. Import it below and add it to the `modules` array
//
// See dashboard-app/README.md → "Adding a new module" for the full guide.
// ─────────────────────────────────────────────────────────────────────────

import demographics from './demographics.js'
import economy from './economy.js'

const modules = [
  demographics,
  economy,
]

export default modules
