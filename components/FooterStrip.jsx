export default function FooterStrip() {
  return (
    <footer className="
      w-full bg-white border-t border-slate-100
      flex items-center justify-between
      px-4 xs:px-8 py-2
      h-[62px] min-h-[62px] z-20
      fixed left-0 bottom-0
      ">
      {/* Left: circular dark icon with N */}
      <div className="flex items-center gap-2">
        <div className="
          w-10 h-10 bg-slate-900/90 text-white rounded-full
          flex items-center justify-center font-bold text-lg shadow-sm
          border-2 border-white
          select-none
        ">
          N
        </div>
      </div>
      {/* Right: WhatsApp CTA removed */}
    </footer>
  );
}