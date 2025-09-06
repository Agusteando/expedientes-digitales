
/**
 * Tailwind CSS configuration
 * Ensure the content globs include both App Router and Pages Router paths,
 * plus components and lib folders, so CSS is generated for all UIs.
 */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
    "./lib/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
