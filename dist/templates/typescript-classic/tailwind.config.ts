import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/**/*.{ts,tsx,js,jsx,html}",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  darkMode: 'class',
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
    enforceMaxContentSize: true,
  },
  theme: {
    extend: {
      // Modern animation utilities
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-subtle': 'bounceSoft 1s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(-2px)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      // Modern blur effects
      backdropBlur: {
        xs: '1px',
        '3xl': '64px',
      },
      // Container queries - new in Tailwind 3.4
      containers: {
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
      },
    },
  },
  plugins: [
    // Add native form control styling
    require('@tailwindcss/forms'),
    // Add modern typography styles
    require('@tailwindcss/typography'),
    // Add container queries support
    require('@tailwindcss/container-queries'),
  ],
} satisfies Config
