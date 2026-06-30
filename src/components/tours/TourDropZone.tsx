import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { Box, Typography, useTheme } from '@mui/material'
import styled from '@emotion/styled'

const Zone = styled.div<{ $dragging: boolean }>`
  border: 2px dashed ${({ $dragging }) => ($dragging ? '#00897B' : '#b0bec5')};
  border-radius: 10px;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.25s, background 0.25s;
  background: ${({ $dragging }) => ($dragging ? 'rgba(0,137,123,0.08)' : 'transparent')};
`

interface Props {
  onFileSelect: (file: File) => void
}

export default function TourDropZone({ onFileSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const panelDivider = isDark ? '#2e2e2e' : '#e8e8e8'
  const fitBg = isDark
    ? 'linear-gradient(135deg,#0d1929,#111827)'
    : 'linear-gradient(135deg,#f0f7ff,#fafbff)'
  const jsonBg = isDark
    ? 'linear-gradient(135deg,#0d1f1a,#0f1f17)'
    : 'linear-gradient(135deg,#e8f5e9,#f5fdf8)'
  const ctaBg = isDark ? '#1a1a1a' : '#fafafa'
  const fitLabel = isDark ? '#5b9bd5' : '#1565c0'
  const jsonLabel = isDark ? '#4db6ac' : '#00695c'
  const subText = isDark ? '#546e7a' : '#90a4ae'
  const ctaText = isDark ? '#555' : '#999'
  const ctaAction = isDark ? '#4db6ac' : '#00897B'

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return
      const name = file.name.toLowerCase()
      if (name.endsWith('.fit') || name.endsWith('.json')) onFileSelect(file)
    },
    [onFileSelect],
  )

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile],
  )

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0]),
    [handleFile],
  )

  return (
    <Zone
      $dragging={dragging}
      data-testid="tour-drop-zone"
      onClick={() => inputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Format panels */}
      <Box sx={{ display: 'flex', borderBottom: `1px solid ${panelDivider}` }}>
        {/* FIT — left, blue */}
        <Box
          sx={{
            flex: 1,
            p: '18px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            borderRight: `1px solid ${panelDivider}`,
            background: fitBg,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg,#1976d2,#42a5f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline
                points="2,14 6,6 10,16 14,10 18,18 22,14"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: fitLabel }}>
              .fit
            </Typography>
            <Typography sx={{ fontSize: 9, color: subText, lineHeight: 1.5, mt: '2px' }}>
              Garmin ·Wahoo
              <br />
              Coros · Suunto …
            </Typography>
          </Box>
        </Box>

        {/* JSON — right, teal */}
        <Box
          sx={{
            flex: 1,
            p: '18px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            background: jsonBg,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'linear-gradient(135deg,#00897B,#4db6ac)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,137,123,0.3)',
            }}
          >
            <Typography
              sx={{ color: 'white', fontFamily: 'monospace', fontSize: 16, fontWeight: 700 }}
            >
              {'{}'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 700, color: jsonLabel }}>
              .json
            </Typography>
            <Typography sx={{ fontSize: 9, color: subText, lineHeight: 1.5, mt: '2px' }}>
              MyTourbook Export
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* CTA bar */}
      <Box sx={{ p: '12px 16px', textAlign: 'center', background: ctaBg }}>
        <Typography component="span" sx={{ fontSize: 12, color: ctaText }}>
          Drop a file here or{' '}
        </Typography>
        <Typography component="span" sx={{ fontSize: 12, color: ctaAction, fontWeight: 600 }}>
          click to select
        </Typography>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept=".fit,.json"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </Zone>
  )
}
