// ─────────────────────────────────────────────────────────────────────────
// Module registry
//
// This is the ONLY file you edit to add a new data module to the dashboard.
// 1. Drop your per-state JSON in public/your-data.json
// 2. Copy templates/module.template.js as a starting template and fill in your fields
// 3. Import it below and add it to the `modules` array
//
// That's it. No component code needed. No other files touched.
//
// See templates/CONTRIBUTING.md for the full 7-step guide.
// ─────────────────────────────────────────────────────────────────────────

import demographics from './demographics.js'
import economy from './economy.js'
import geography from './geography.js'
// import realestate from './realestate.js'       // Yeswant
// import politics from './politics.js'           // Vishal
// import agriculture from './agriculture.js'     // Bala

const modules = [
  demographics,
  economy,
  geography,
  // realestate,                                  // Yeswant
  // politics,                                    // Vishal
  // agriculture,                                 // Bala
]

export default modules
