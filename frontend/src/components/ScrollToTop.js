import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top when route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll
    });
    
    // Also ensure the document elements are scrolled to top
    // This handles different browser implementations
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // For debugging - you can remove this log in production
    console.log(`📍 Navigated to ${pathname} - scrolled to top`);
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
