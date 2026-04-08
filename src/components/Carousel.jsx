import React, { useState, useRef, useEffect, useCallback } from 'react'

export default function Carousel({ children, slideCount, autoPlay = true, interval = 4000 }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const timerRef = useRef(null)

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % slideCount)
  }, [slideCount])

  // Auto-scroll
  useEffect(() => {
    if (!autoPlay) return
    timerRef.current = setInterval(nextSlide, interval)
    return () => clearInterval(timerRef.current)
  }, [autoPlay, interval, nextSlide])

  // Reset timer on manual interaction
  const goToSlide = (index) => {
    setCurrentSlide(index)
    if (timerRef.current) clearInterval(timerRef.current)
    if (autoPlay) timerRef.current = setInterval(nextSlide, interval)
  }

  const handleTouchStart = (e) => { touchStartX.current = e.changedTouches[0].screenX }
  const handleTouchMove = (e) => { touchEndX.current = e.changedTouches[0].screenX }
  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      goToSlide((currentSlide + 1) % slideCount)
    }
    if (touchEndX.current - touchStartX.current > 50) {
      goToSlide((currentSlide - 1 + slideCount) % slideCount)
    }
  }

  return (
    <div className="glass rounded-3xl overflow-hidden hover-card">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
      <div className="flex justify-center gap-2 pb-5">
        {Array.from({ length: slideCount }).map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? 'w-8 bg-primary-500'
                : 'w-2 bg-black/10 dark:bg-white/20 hover:bg-black/15 dark:hover:bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
