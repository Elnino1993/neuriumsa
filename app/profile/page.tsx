import { Header } from "@/components/header"
import { ProfileSection } from "@/components/profile-section"
import { Footer } from "@/components/footer"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <ProfileSection />
      </main>
      <Footer />
    </div>
  )
}
