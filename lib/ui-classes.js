
export const wizardCard = `
  relative
  w-full
  max-w-[99vw] xs:max-w-[420px] md:max-w-2xl lg:max-w-3xl
  min-h-[470px] sm:min-h-[560px] md:min-h-[640px]
  mx-auto flex flex-col shadow-2xl
  rounded-3xl
  bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80
  px-2 xs:px-7 md:px-12 pt-6 md:pt-10 pb-20 gap-2 mb-0
  backdrop-blur-[14px]
  transition-all duration-200
`.replace(/\s\s+/g, " ");

export const mainButton = `
  w-full py-3 rounded-full bg-gradient-to-r from-fuchsia-700 to-cyan-600
  text-white font-extrabold text-base md:text-lg shadow-lg
  hover:from-cyan-700 hover:to-fuchsia-900
  focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:ring-offset-0 focus:ring-offset-white transition
  ring-0 focus-visible:ring-4
`;

export const navigationButton = `
  inline-flex items-center gap-2
  px-5 py-3 rounded-full font-bold bg-fuchsia-700
  text-white border border-fuchsia-900
  shadow-md text-lg md:text-xl
  transition hover:bg-fuchsia-600 focus-visible:ring-2 focus:ring-fuchsia-400 outline-none
`;

export const secondaryButton = `
  inline-flex items-center gap-2
  px-5 py-3 rounded-full font-bold bg-slate-50 dark:bg-slate-800
  text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800
  shadow-sm text-base md:text-lg
  hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30
  focus:outline-none focus:ring-2 focus:ring-fuchsia-300
`;

export const stepperButton = `
  rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center
  text-xl font-bold border
  focus:ring-2 focus:ring-fuchsia-400 transition
`;

export const dropzone = `
  flex flex-col items-center justify-center w-full min-h-[124px] md:min-h-[152px]
  p-4 md:p-6 border-2 border-dashed border-cyan-300
  rounded-xl transition
  bg-cyan-50 hover:bg-cyan-100 dark:bg-slate-800/50 cursor-pointer
`;

export const inputBase = `
  w-full max-w-xs text-sm border border-cyan-200 dark:border-slate-700 px-2 py-2 rounded
  bg-white dark:bg-slate-900 shadow-sm focus:border-cyan-400 focus:outline-none
`;
