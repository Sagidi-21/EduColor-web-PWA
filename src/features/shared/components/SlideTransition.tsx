import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface SlideTransitionProps {
  isOpen: boolean;
  onClose?: () => void;
  duration?: number;
  children: ReactNode;
  className?: string;
}

export function SlideTransition({
  isOpen,
  onClose,
  duration = 1200,
  children,
  className = "",
}: SlideTransitionProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // When isOpen changes to true, render immediately (state update during render)
  if (isOpen && !shouldRender) {
    setShouldRender(true);
    setIsExiting(false);
  }

  // Schedule exit animation when isOpen becomes false
  useEffect(() => {
    if (!isOpen && shouldRender) {
      const raf = requestAnimationFrame(() => {
        setIsExiting(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen, shouldRender]);

  // Clean up after exit animation completes
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setShouldRender(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isExiting, duration, onClose]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`slide-transition ${isExiting ? "slide-transition--exiting" : ""} ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
