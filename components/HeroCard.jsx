
import CTAButton from "./CTAButton";
import VisualPreview from "./VisualPreview";
import FooterLinks from "./FooterLinks";

export default function HeroCard() {
  return (
    <section
      className="relative w-full max-w-md xs:max-w-xl md:max-w-2xl mx-auto
      flex flex-col items-center justify-center
      bg-white/90 dark:bg-slate-900/95 border border-slate-100 dark:border-slate-900
      shadow-2xl rounded-3xl px-4 xs:px-6 sm:px-12 py-7 xs:py-9 sm:py-12
      mb-6 backdrop-blur-xl z-10
      transition-all duration-200"
      style={{ boxShadow: "0 10px 48px 0 rgba(120,60,180,0.11)" }}
    >
      {/* Brand/title in card for mobile only */}
      <div className="flex flex-col md:hidden items-center mb-4 select-none">
        <div className="relative w-16 h-16 xs:w-20 xs:h-20 mb-2">
          <img
            src="/IMAGOTIPO-IECS-IEDIS.png"
            alt="IECS-IEDIS"
            loading="eager"
            className="object-contain bg-white rounded-xl shadow"
            width={80}
            height={80}
          />
        </div>
        <span className="font-fredoka font-bold text-lg xs:text-xl text-purple-800 dark:text-fuchsia-200 tracking-tight">
          IECS-IEDIS
        </span>
      </div>
      {/* Headline + value prop */}
      <h1 className="font-fredoka text-xl xs:text-2xl sm:text-3xl md:text-4xl text-center font-extrabold text-purple-900 dark:text-fuchsia-100 mb-2 tracking-tight select-none">
        Expediente Laboral Digital
      </h1>
      <p className="text-base xs:text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-200 text-center mb-3 max-w-lg px-1 select-none">
        Plataforma segura para empleados y administración de IECS-IEDIS.
      </p>
      {/* Hero illustration/dashboard preview */}
      <div className="w-full flex items-center justify-center mb-4 sm:mb-7">
        <VisualPreview />
      </div>
      <p className="text-slate-600 dark:text-slate-300 text-center text-sm xs:text-base max-w-md mb-5">
        <span className="font-semibold text-fuchsia-700 dark:text-fuchsia-400">Sube tus documentos y firma digitalmente tu contrato</span>: todo en un solo lugar, simple y sin complicaciones.
      </p>
      {/* CTAs */}
      <div className="w-full flex flex-col gap-3 sm:flex-row sm:gap-6 items-center justify-center mb-2">
        <CTAButton
          href="/login"
          primary
          icon="employee"
        >
          Soy Empleado/a o Candidato/a
        </CTAButton>
        <CTAButton
          href="/admin/login"
          icon="admin"
        >
          Soy Administrador/a
        </CTAButton>
      </div>
      {/* Tertiary links/FAQ/support etc */}
      <FooterLinks />
    </section>
  );
}
