import AuthGate from "@/components/AuthGate";
import DashboardShell from "@/components/DashboardShell";

// Every page in this group needs a signed-in admin and shows the sidebar.
// /login lives outside the group, so it renders full-screen with no sidebar.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DashboardShell>{children}</DashboardShell>
    </AuthGate>
  );
}
