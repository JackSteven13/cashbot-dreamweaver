
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Function to determine if the device is mobile based on screen width
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Initial check
    checkMobile()
    
    // Add event listeners for both resize and orientation change
    window.addEventListener("resize", checkMobile)
    
    // Handle orientation change specifically
    if ('onorientationchange' in window) {
      window.addEventListener("orientationchange", () => {
        // Small delay to ensure accurate measurements after rotation completes
        setTimeout(checkMobile, 100)
      })
    }
    
    // Cleanup event listeners
    return () => {
      window.removeEventListener("resize", checkMobile)
      if ('onorientationchange' in window) {
        window.removeEventListener("orientationchange", checkMobile as any)
      }
    }
  }, [])

  return !!isMobile
}
