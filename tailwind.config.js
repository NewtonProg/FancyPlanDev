/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        'apple-blue': '#007AFF',
        'apple-green': '#34C759',
        'apple-red': '#FF3B30',
        'apple-orange': '#FF9500',
        'apple-gray': {
          50: '#F5F5F7',
          100: '#E5E5EA',
          200: '#C7C7CC',
          300: '#AEAEB2',
          400: '#8E8E93',
          500: '#636366',
          600: '#48484A',
          700: '#3A3A3C',
          800: '#2C2C2E',
          900: '#1C1C1E',
        },
        // Midnight Executive — CSS-variable-backed (theme-switchable)
        'primary':                   'rgb(var(--fp-primary) / <alpha-value>)',
        'on-primary':                'rgb(var(--fp-on-primary) / <alpha-value>)',
        'primary-container':         'rgb(var(--fp-primary-container) / <alpha-value>)',
        'on-primary-container':      'rgb(var(--fp-on-primary-container) / <alpha-value>)',
        'inverse-primary':           'rgb(var(--fp-inverse-primary) / <alpha-value>)',
        'primary-fixed':             'rgb(var(--fp-primary-fixed) / <alpha-value>)',
        'primary-fixed-dim':         'rgb(var(--fp-primary-fixed-dim) / <alpha-value>)',
        'on-primary-fixed':          'rgb(var(--fp-on-primary-fixed) / <alpha-value>)',
        'on-primary-fixed-variant':  'rgb(var(--fp-on-primary-fixed-variant) / <alpha-value>)',
        'secondary':                 'rgb(var(--fp-secondary) / <alpha-value>)',
        'on-secondary':              'rgb(var(--fp-on-secondary) / <alpha-value>)',
        'secondary-container':       'rgb(var(--fp-secondary-container) / <alpha-value>)',
        'on-secondary-container':    'rgb(var(--fp-on-secondary-container) / <alpha-value>)',
        'secondary-fixed':           'rgb(var(--fp-secondary-fixed) / <alpha-value>)',
        'secondary-fixed-dim':       'rgb(var(--fp-secondary-fixed-dim) / <alpha-value>)',
        'on-secondary-fixed':        'rgb(var(--fp-on-secondary-fixed) / <alpha-value>)',
        'on-secondary-fixed-variant':'rgb(var(--fp-on-secondary-fixed-variant) / <alpha-value>)',
        'tertiary':                  'rgb(var(--fp-tertiary) / <alpha-value>)',
        'on-tertiary':               'rgb(var(--fp-on-tertiary) / <alpha-value>)',
        'tertiary-container':        'rgb(var(--fp-tertiary-container) / <alpha-value>)',
        'on-tertiary-container':     'rgb(var(--fp-on-tertiary-container) / <alpha-value>)',
        'tertiary-fixed':            'rgb(var(--fp-tertiary-fixed) / <alpha-value>)',
        'tertiary-fixed-dim':        'rgb(var(--fp-tertiary-fixed-dim) / <alpha-value>)',
        'on-tertiary-fixed':         'rgb(var(--fp-on-tertiary-fixed) / <alpha-value>)',
        'on-tertiary-fixed-variant': 'rgb(var(--fp-on-tertiary-fixed-variant) / <alpha-value>)',
        'error':                     'rgb(var(--fp-error) / <alpha-value>)',
        'on-error':                  'rgb(var(--fp-on-error) / <alpha-value>)',
        'error-container':           'rgb(var(--fp-error-container) / <alpha-value>)',
        'on-error-container':        'rgb(var(--fp-on-error-container) / <alpha-value>)',
        'surface':                   'rgb(var(--fp-surface) / <alpha-value>)',
        'surface-dim':               'rgb(var(--fp-surface-dim) / <alpha-value>)',
        'surface-bright':            'rgb(var(--fp-surface-bright) / <alpha-value>)',
        'surface-container-lowest':  'rgb(var(--fp-surface-container-lowest) / <alpha-value>)',
        'surface-container-low':     'rgb(var(--fp-surface-container-low) / <alpha-value>)',
        'surface-container':         'rgb(var(--fp-surface-container) / <alpha-value>)',
        'surface-container-high':    'rgb(var(--fp-surface-container-high) / <alpha-value>)',
        'surface-container-highest': 'rgb(var(--fp-surface-container-highest) / <alpha-value>)',
        'on-surface':                'rgb(var(--fp-on-surface) / <alpha-value>)',
        'on-surface-variant':        'rgb(var(--fp-on-surface-variant) / <alpha-value>)',
        'inverse-surface':           'rgb(var(--fp-inverse-surface) / <alpha-value>)',
        'inverse-on-surface':        'rgb(var(--fp-inverse-on-surface) / <alpha-value>)',
        'outline':                   'rgb(var(--fp-outline) / <alpha-value>)',
        'outline-variant':           'rgb(var(--fp-outline-variant) / <alpha-value>)',
        'surface-tint':              'rgb(var(--fp-surface-tint) / <alpha-value>)',
        'surface-variant':           'rgb(var(--fp-surface-variant) / <alpha-value>)',
        'background':                'rgb(var(--fp-background) / <alpha-value>)',
        'on-background':             'rgb(var(--fp-on-background) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      fontSize: {
        'display-lg':  ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '600' }],
        'headline-md': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'title-lg':    ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'body-lg':     ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md':     ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-caps':  ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
      },
      borderRadius: {
        apple: '12px',
        'apple-sm': '8px',
        'apple-lg': '16px'
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)',
        apple: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
        'apple-lg': '0 10px 25px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
}
