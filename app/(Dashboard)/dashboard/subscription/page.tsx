import { Metadata } from 'next'
import SubscriptionClient from '@/components/dashboard/SubscriptionClient'

export const metadata: Metadata = {
  title: 'Subscription | hrmian Dashboard',
  description: 'Manage subscription plans and view earnings',
}

export default function SubscriptionPage() {
  return <SubscriptionClient />
}
