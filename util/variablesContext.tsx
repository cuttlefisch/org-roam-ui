import { createContext } from 'react'
import { EmacsVariables } from '../pages'

type Theme = [name: string, themeObject: { [color: string]: string }]

const VariablesContext = createContext<EmacsVariables>({
  subDirs: ['dailies', '.attach'],
  attachDir: '.attach',
  roamDir: '~/org',
  dailyDir: 'dailies',
})
export { VariablesContext }
