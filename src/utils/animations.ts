
import { useState, useEffect } from 'react';

interface IntersectionOptions {
  threshold?: number;
  rootMargin?: string;
  root?: Element | null;
}

export const useIntersectionObserver = (
  options: IntersectionOptions = {}
): [React.RefObject<HTMLElement>, boolean] => {
  const [ref, setRef] = useState<React.RefObject<HTMLElement>>({ current: null });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px',
      root: options.root || null
    });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options.threshold, options.rootMargin, options.root]);

  return [ref, isVisible];
};

// Create a function to generate money particles on demand
export const createMoneyParticles = (targetElement: HTMLElement, count = 15) => {
  if (!targetElement) return;
  
  const rect = targetElement.getBoundingClientRect();
  const particles = [];
  
  // Create particle elements
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'money-particle';
    particle.textContent = ['💰', '💸', '🪙'][Math.floor(Math.random() * 3)];
    
    // Set random starting position near the target
    const startX = rect.left + rect.width / 2 + (Math.random() - 0.5) * 20;
    const startY = rect.top + rect.height / 2 + (Math.random() - 0.5) * 20;
    
    // Set random ending position around the target
    const endX = (Math.random() - 0.5) * 200;
    const endY = (Math.random() - 0.5) * 200;
    const rotation = Math.random() * 360;
    
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    
    // Set CSS variables properly using setProperty
    particle.style.setProperty('--tx', `${endX}px`);
    particle.style.setProperty('--ty', `${endY}px`);
    particle.style.setProperty('--r', `${rotation}deg`);
    
    particle.style.fontSize = `${Math.random() * 10 + 14}px`;
    
    document.body.appendChild(particle);
    particles.push(particle);
  }
  
  // Remove particles after animation completes
  setTimeout(() => {
    particles.forEach(p => p.remove());
  }, 1500);
};

export const slideVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  }
};

export const staggerChildrenVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

// Sound effect utilities
export const playSoundEffect = (soundName: 'click' | 'success' | 'error' | 'notification') => {
  const soundMap = {
    click: '/sounds/button-click.mp3',
    success: '/sounds/cash-register.mp3',
    error: '/sounds/error.mp3',
    notification: '/sounds/notification.mp3'
  };
  
  try {
    const audio = new Audio(soundMap[soundName]);
    audio.volume = 0.7;
    audio.play().catch(e => console.error("Error playing sound:", e));
  } catch (error) {
    console.error("Error creating audio element:", error);
  }
};
