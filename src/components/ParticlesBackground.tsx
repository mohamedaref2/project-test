
import React, { useEffect } from "react";

interface ParticlesBackgroundProps {
  isDarkMode: boolean;
}

// Type definition for window.particlesJS
declare global {
  interface Window {
    particlesJS: any;
  }
}

const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({ isDarkMode }) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.particlesJS) {
      window.particlesJS('particles', {
        particles: {
          number: { value: 80 },
          color: { value: isDarkMode ? '#ffffff' : '#6366f1' },
          opacity: { value: 0.2 },
          size: { value: 3 },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: isDarkMode ? '#ffffff' : '#6366f1',
            opacity: 0.1,
            width: 1
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "grab"
            },
            resize: true
          },
        },
      });
    }
  }, [isDarkMode]);

  return <div id="particles" className="absolute inset-0 z-0"></div>;
};

export default ParticlesBackground;
