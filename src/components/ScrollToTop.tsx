import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Function to reset scroll on all possible scrollable elements
    const resetScroll = () => {
      // Reset window scroll
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      
      // Reset document elements
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      
      // Reset any scrollable containers (like main elements)
      const scrollableElements = document.querySelectorAll('main, [role="main"], [data-scroll-container], .overflow-auto, .overflow-y-auto, .overflow-x-auto');
      scrollableElements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.scrollTop = 0;
          el.scrollLeft = 0;
        }
      });
    };

    // Reset immediately
    resetScroll();
    
    // Reset on next frame to ensure DOM has updated
    const rafId = requestAnimationFrame(() => {
      resetScroll();
    });
    
    // Reset after a small delay to catch any delayed renders or async content
    const timeoutId1 = setTimeout(() => {
      resetScroll();
    }, 0);

    // Reset after a longer delay to catch any lazy-loaded content
    const timeoutId2 = setTimeout(() => {
      resetScroll();
    }, 100);

    // Reset after an even longer delay for any very slow async content
    const timeoutId3 = setTimeout(() => {
      resetScroll();
    }, 300);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [pathname]);

  return null;
}






