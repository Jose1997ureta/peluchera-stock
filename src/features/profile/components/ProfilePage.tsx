import { ChangePasswordSection } from './ChangePasswordSection'
import { LogoutSection } from './LogoutSection'
import { ProfileAvatarSection } from './ProfileAvatarSection'
import { ProfileInfoSection } from './ProfileInfoSection'
import { ThemePreferenceSection } from './ThemePreferenceSection'

export default function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <ProfileAvatarSection />
      <ProfileInfoSection />
      <ChangePasswordSection />
      <ThemePreferenceSection />
      <LogoutSection />
    </div>
  )
}
