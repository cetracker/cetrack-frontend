import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll } from 'vitest'
import i18n from '@/i18n'

beforeAll(() => i18n.changeLanguage('en'))
afterEach(cleanup)
