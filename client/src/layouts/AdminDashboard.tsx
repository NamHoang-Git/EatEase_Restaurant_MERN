import "@/index.css"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/top-nav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SettingsProvider } from "@/contexts/settings-context"
import { ThemeProvider } from '@/components/theme-provider';
import { Outlet } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <TooltipProvider delayDuration={0}>
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 overflow-auto">
              <TopNav />
              <div className="container mx-auto p-6 max-w-7xl">
                <main className="w-full">
                  <Outlet />
                </main>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </SettingsProvider>
    </ThemeProvider>
  )
}
