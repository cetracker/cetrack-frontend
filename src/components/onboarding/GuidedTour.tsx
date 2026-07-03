import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Box, Button, Paper, Popper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { useOnboarding } from '@/hooks/useOnboarding'

interface TourStep {
  nav: string
  title: string
  body: string
}

const steps: TourStep[] = [
  { nav: 'bikes', title: 'Bikes', body: 'Start by creating the bikes you ride.' },
  { nav: 'partTypes', title: 'Part Types', body: 'Define the part types each bike needs, e.g. chain or tyres.' },
  { nav: 'parts', title: 'Parts', body: 'Add your physical parts and relate them to a part type.' },
  { nav: 'tourImport', title: 'Import Tours', body: 'Import tours from a .FIT file or a MyTourbook export.' },
  { nav: 'tours', title: 'Tours', body: 'Review the tours you have imported.' },
  { nav: 'report', title: 'Report', body: 'Inspect usage statistics to plan maintenance.' },
]

const useReducedMotion = () =>
  useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true })

export const GuidedTour = () => {
  const { tourOpen, finishTour } = useOnboarding()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const reducedMotion = useReducedMotion()
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const primaryButtonRef = useRef<HTMLButtonElement>(null)

  const open = tourOpen && !isMobile

  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setStepIndex(0)
  }

  useLayoutEffect(() => {
    if (!open) return

    const updateRect = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${steps[stepIndex].nav}"]`)
      setRect(el ? el.getBoundingClientRect() : null)
    }

    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [open, stepIndex])

  useEffect(() => {
    if (open) primaryButtonRef.current?.focus()
  }, [open, stepIndex])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishTour()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, finishTour])

  if (!open || !rect) return null

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1

  const handleNext = () => (isLast ? finishTour() : setStepIndex((i) => i + 1))
  const handleBack = () => setStepIndex((i) => Math.max(0, i - 1))

  const spotlightTransition = reducedMotion ? 'none' : 'top 0.25s, left 0.25s, width 0.25s, height 0.25s'

  return (
    <>
      <Box
        aria-hidden
        sx={{
          position: 'fixed',
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          borderRadius: `${theme.shape.borderRadius}px`,
          boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
          transition: spotlightTransition,
          zIndex: theme.zIndex.drawer + 2,
          pointerEvents: 'none',
        }}
      />
      <Popper
        open
        anchorEl={{ getBoundingClientRect: () => rect, nodeType: 1 } as unknown as Element}
        placement="right-start"
        sx={{ zIndex: theme.zIndex.drawer + 3 }}
        modifiers={[{ name: 'offset', options: { offset: [0, 12] } }]}
      >
        <Paper
          role="dialog"
          aria-label="Guided tour"
          elevation={4}
          sx={{ p: 2, maxWidth: 280 }}
        >
          <Typography aria-live="polite" variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {step.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {step.body}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.75, mb: 2 }}>
            {steps.map((s, i) => (
              <Box
                key={s.nav}
                data-testid="tour-progress-dot"
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: i === stepIndex ? 'primary.main' : 'action.disabled',
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" onClick={finishTour}>
              Skip
            </Button>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {stepIndex > 0 && (
                <Button size="small" onClick={handleBack}>
                  Back
                </Button>
              )}
              <Button ref={primaryButtonRef} size="small" variant="contained" onClick={handleNext}>
                {isLast ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Popper>
    </>
  )
}
