import fs from 'fs'

const FILE = './whitelist.json'

// Load whitelist from file (persists across restarts)
function load() {
  if (!fs.existsSync(FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'))
  } catch {
    return {}
  }
}

function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2))
}

export function isApproved(number) {
  const list = load()
  return !!list[number]
}

export function addStudent(number, school = 'YSJ', country = '') {
  const list = load()
  list[number] = {
    school,
    country,
    addedAt: new Date().toISOString(),
  }
  save(list)
}

export function removeStudent(number) {
  const list = load()
  if (!list[number]) return false
  delete list[number]
  save(list)
  return true
}

export function getStudent(number) {
  const list = load()
  return list[number] || null
}

export function getAllStudents() {
  return load()
}

export function getCount() {
  return Object.keys(load()).length
}
