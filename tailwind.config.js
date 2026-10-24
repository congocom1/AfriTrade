/** @type {import('tailwindcss').Config} */

/* One status ramp per semantic role, driven by the tokens in src/index.css.
   `success-100` is a soft tint, `success-900` its ink, `success-500/600` the
   solid fill — the scales invert in dark mode, so the same class pair reads
   correctly in both. */
const RAMP_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
const ramp = (name) =>
  Object.fromEntries(RAMP_STEPS.map((step) => [step, `hsl(var(--${name}-${step}))`]));

module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
      '3xl': 'calc(var(--radius) + 4px)',
      '2xl': 'calc(var(--radius) + 2px)',
      xl: 'var(--radius)',
      lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem',
  		},
  		fontSize: {
  			'2xs': ['0.6875rem', { lineHeight: '1rem' }],
  			'5xl': ['2.25rem', { lineHeight: '2.5rem' }],
  			'6xl': ['3rem', { lineHeight: '3.25rem' }],
  		},
  		fontWeight: {
  			medium: '500',
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))',
  				...ramp('destructive')
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			success: {
  				DEFAULT: 'hsl(var(--success))',
  				foreground: 'hsl(var(--success-foreground))',
  				...ramp('success')
  			},
  			warning: {
  				DEFAULT: 'hsl(var(--warning))',
  				foreground: 'hsl(var(--warning-foreground))',
  				...ramp('warning')
  			},
  			info: {
  				DEFAULT: 'hsl(var(--info))',
  				foreground: 'hsl(var(--info-foreground))',
  				...ramp('info')
  			},

  			/* Migration bridge: the raw Tailwind palettes still used across older
  			   screens resolve to the semantic ramps above, so every one of them
  			   follows the theme today. New code should use the semantic names
  			   (success / warning / destructive / info); these aliases can be
  			   dropped once no screen references them. */
  			emerald: ramp('success'),
  			green: ramp('success'),
  			lime: ramp('success'),
  			amber: ramp('warning'),
  			yellow: ramp('warning'),
  			orange: ramp('warning'),
  			red: ramp('destructive'),
  			rose: ramp('destructive'),
  			sky: ramp('info'),
  			blue: ramp('info'),
  			indigo: ramp('info'),
  			violet: ramp('info'),
  			purple: ramp('info'),
  			cyan: ramp('info'),
  			teal: ramp('info'),

  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}
