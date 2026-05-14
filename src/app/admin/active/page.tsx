import { redirect } from 'next/navigation'

export default function ActiveAthletesPage() {
	redirect('/admin/applications?status=APPROVED')
}
