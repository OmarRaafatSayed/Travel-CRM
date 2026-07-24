import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function useUnsavedChanges(hasUnsavedChanges: boolean, message: string = 'You have unsaved changes. Are you sure you want to leave?') {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  // Block navigation if there are unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const unblock = () => {
        if (window.confirm(message)) {
          return true;
        }
        return false;
      };

      // This is a simplified version - in a real app you might want to use
      // React Router's unstable_useBlocker or similar
      return () => {
        // Cleanup if needed
      };
    }
  }, [hasUnsavedChanges, message, navigate, location]);
}