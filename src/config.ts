import * as fs from 'fs'
import * as path from 'path'

export default (): { API_KEY: string, API_DOMAIN: string } => {
  const currentFileUrl = path.resolve('.config')
  const rawJson = fs.readFileSync(path.join(currentFileUrl, 'fullstory.json'), {encoding: 'utf-8'})
  return JSON.parse(rawJson)
}
