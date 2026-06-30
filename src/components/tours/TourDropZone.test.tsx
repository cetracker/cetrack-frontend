// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@mui/material'
import { lightTheme } from '@/theme'
import TourDropZone from './TourDropZone'

const renderComponent = (onFileSelect = vi.fn()) =>
  render(
    <ThemeProvider theme={lightTheme}>
      <TourDropZone onFileSelect={onFileSelect} />
    </ThemeProvider>,
  )

const makeFile = (name: string) => new File(['data'], name)

const getInput = () => document.querySelector('input[type="file"]') as HTMLInputElement

describe('TourDropZone', () => {
  it('calls onFileSelect with a .fit file via input change', async () => {
    const onFileSelect = vi.fn()
    renderComponent(onFileSelect)
    await userEvent.upload(getInput(), makeFile('ride.fit'))
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'ride.fit' }))
  })

  it('calls onFileSelect with a .json file via input change', async () => {
    const onFileSelect = vi.fn()
    renderComponent(onFileSelect)
    await userEvent.upload(getInput(), makeFile('tours.json'))
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'tours.json' }))
  })

  it('does not call onFileSelect for an unsupported extension', async () => {
    const onFileSelect = vi.fn()
    renderComponent(onFileSelect)
    await userEvent.upload(getInput(), makeFile('data.csv'))
    expect(onFileSelect).not.toHaveBeenCalled()
  })

  it('accepts .FIT uppercase (case-insensitive)', async () => {
    const onFileSelect = vi.fn()
    renderComponent(onFileSelect)
    await userEvent.upload(getInput(), makeFile('RIDE.FIT'))
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'RIDE.FIT' }))
  })

  it('accepts .JSON uppercase (case-insensitive)', async () => {
    const onFileSelect = vi.fn()
    renderComponent(onFileSelect)
    await userEvent.upload(getInput(), makeFile('TOURS.JSON'))
    expect(onFileSelect).toHaveBeenCalledWith(expect.objectContaining({ name: 'TOURS.JSON' }))
  })

  it('calls onFileSelect on drop of a .fit file', () => {
    const onFileSelect = vi.fn()
    renderComponent(onFileSelect)
    const zone = screen.getByTestId('tour-drop-zone')
    const file = makeFile('ride.fit')
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })
    expect(onFileSelect).toHaveBeenCalledWith(file)
  })
})
