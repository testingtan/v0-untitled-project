import { SidebarProvider } from "@/components/ui/sidebar"
import { MainLayout } from "@/components/main-layout"

export default function Home() {
  return (
    <SidebarProvider>
      <MainLayout />
    </SidebarProvider>
  )
}
