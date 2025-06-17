
import Providers from "@/components/Providers";
import UserTopNav from "@/components/UserTopNav";


export default function DashboardLayout({ children }) {
  return (
    <Providers>
      <UserTopNav />
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-20">
        <main className="flex-1 w-full flex flex-col items-center justify-center">
          {children}
        </main>
      </div>
    </Providers>
  );
}
