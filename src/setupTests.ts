import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import i18n from '@/i18n'

// findBy*/waitFor default to 1000ms, too tight when all workers render MUI trees at once.
configure({ asyncUtilTimeout: 5000 })

beforeAll(() => i18n.changeLanguage('en'))
afterEach(cleanup)
