// Configuración PostCSS corregida: usar el plugin oficial "tailwindcss" en lugar de "@tailwindcss/postcss"
// para que las directivas @tailwind se procesen y se genere el CSS.
// Configuración PostCSS en formato ESM porque el proyecto usa "type": "module" en package.json
// y Tailwind v4 recomienda el plugin "@tailwindcss/postcss".
// PostCSS config para TailwindCSS estable (v3.x)
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};