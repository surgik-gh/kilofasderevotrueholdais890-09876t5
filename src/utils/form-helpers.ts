import { useEffect, useRef } from 'react';

/**
 * Hook to autofocus the first input field in a form on mobile devices
 * @param enabled - Whether autofocus should be enabled (default: true on mobile)
 */
export function useFormAutofocus(enabled: boolean = true) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!enabled || !formRef.current) return;

    // Only autofocus on mobile devices
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    // Find the first input, textarea, or select element
    const firstInput = formRef.current.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
    );

    if (firstInput) {
      // Small delay to ensure the keyboard doesn't interfere with page load
      setTimeout(() => {
        firstInput.focus();
      }, 300);
    }
  }, [enabled]);

  return formRef;
}

/**
 * Prevents zoom on iOS when focusing input fields
 * Call this once in your app initialization
 */
export function preventIOSZoom() {
  if (typeof window === 'undefined') return;

  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );
  }
}

/**
 * Handles virtual keyboard behavior on mobile
 * Scrolls the focused input into view when keyboard appears
 */
export function handleVirtualKeyboard(inputElement: HTMLElement) {
  if (typeof window === 'undefined') return;

  const isMobile = window.innerWidth < 768;
  if (!isMobile) return;

  // Scroll the input into view when focused
  inputElement.addEventListener('focus', () => {
    setTimeout(() => {
      inputElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 300); // Wait for keyboard to appear
  });
}

/**
 * Optimizes form field sizes for mobile
 * Ensures minimum touch target sizes
 */
export function optimizeFormFieldForMobile(element: HTMLElement) {
  if (typeof window === 'undefined') return;

  const isMobile = window.innerWidth < 768;
  if (!isMobile) return;

  // Ensure minimum touch target size
  const minSize = 44;
  const currentHeight = element.offsetHeight;
  
  if (currentHeight < minSize) {
    element.style.minHeight = `${minSize}px`;
  }

  // Ensure font size is at least 16px to prevent zoom on iOS
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  
  if (fontSize < 16) {
    element.style.fontSize = '16px';
  }
}
