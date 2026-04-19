import React, { useState, useEffect, useRef } from 'react'

/**
 * Animated number counter (count-up effect)
 * Uses requestAnimationFrame for smooth animation
 */

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export function NumberCounter({ value = 0, duration = 800, formatter = (v) => v.toFixed(0) }) {
  const [displayValue, setDisplayValue] = useState(0)
  const prevValueRef = useRef(0)
  const animRef = useRef(null)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const startValue = prevValueRef.current
    const endValue = value

    if (startValue === endValue) return

    // Cancel previous animation
    if (animRef.current) cancelAnimationFrame(animRef.current)
    startTimeRef.current = null

    const isLowPerf = typeof navigator !== 'undefined' && navigator.hardwareConcurrency < 4
    if (isLowPerf) {
      setDisplayValue(endValue)
      prevValueRef.current = endValue
      return
    }

    function animate(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutExpo(progress)
      const current = startValue + (endValue - startValue) * easedProgress

      setDisplayValue(current)

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        prevValueRef.current = endValue
      }
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [value, duration])

  return <span className="tabular-nums">{formatter(displayValue)}</span>
}
