/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                cream: {
                    50: '#FEFDFB',
                    100: '#FBF9F5',
                    200: '#F7F4ED',
                },
                black: {
                    DEFAULT: '#0A0A0A',
                    soft: '#1A1A1A',
                    muted: '#8E8E93',
                },
                primary: {
                    DEFAULT: '#FF6B35',
                    hover: '#E85F2F',
                    light: '#FFE8DF',
                },
                glass: {
                    border: 'rgba(255, 255, 255, 0.18)',
                    borderHover: 'rgba(255, 107, 53, 0.2)',
                }
            },
            fontFamily: {
                ritafurey: ['"Playfair Display"', 'Georgia', 'serif'],
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [require('@tailwindcss/typography')],
}
