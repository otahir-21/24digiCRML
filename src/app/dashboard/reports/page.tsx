import { redirect } from 'next/navigation'

export default function ReportsPage() {
  // Redirect to the analytics page since it contains comprehensive reporting
  redirect('/dashboard/analytics')
}