'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { api, formatApiError } from '@/lib/api-client'

interface Profile {
  user: number
  name: string
  institute: string
  designation: string
  subject: string
  country: number
  country_name: string
  email: string
  username: string
  subscription_status: string
  created: string
  updated: string
}

interface SubscriptionPackage {
  id: number
  name: string
  price: string
  offer_price: string | null
  duration_days: number
  created: string
}

export default function ProfileSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packages, setPackages] = useState<SubscriptionPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [profileForm, setProfileForm] = useState({
    name: '',
    institute: '',
    designation: '',
    subject: '',
    email: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await api.get<Profile>('/profile/')
      setProfile(data)
      setProfileForm({
        name: data.name,
        institute: data.institute,
        designation: data.designation,
        subject: data.subject,
        email: data.email,
      })
    } catch (err) {
      setMessage(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const fetchPackages = async () => {
    try {
      const data = await api.get<SubscriptionPackage[]>('/subscription-packages/')
      setPackages(data)
    } catch (err) {
      console.error('Failed to fetch packages', err)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchPackages()
  }, [])

  const handleProfileUpdate = async () => {
    if (!profile) return
    setSaving(true)
    setMessage('')

    try {
      await api.patch(`/profile/${profile.user}/`, {
        name: profileForm.name,
        institute: profileForm.institute,
        designation: profileForm.designation,
        subject: profileForm.subject,
        email: profileForm.email,
        country: profile.country,
      })
      setMessage('Profile updated successfully')
      fetchProfile()
    } catch (err) {
      setMessage(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setMessage('')

    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      setMessage('All fields are required')
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage('Passwords do not match')
      return
    }

    if (passwordForm.new_password.length < 8) {
      setMessage('Password must be at least 8 characters')
      return
    }

    setSaving(true)

    try {
      await api.post('/profile/change_password/', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      setMessage('Password changed successfully')
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setMessage(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          {message}
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Username</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                    {profile?.username}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Subscription</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded text-sm uppercase">
                    {profile?.subscription_status}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institute">Institute</Label>
                  <Input
                    id="institute"
                    value={profileForm.institute}
                    onChange={(e) => setProfileForm({ ...profileForm, institute: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={profileForm.designation}
                    onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={profileForm.subject}
                  onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-sm text-gray-600">Country</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded text-sm">
                  {profile?.country_name}
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current_password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirm_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                Password must be at least 8 characters long
              </div>

              <Button onClick={handlePasswordChange} disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="flex flex-col hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.duration_days} Days Access</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-4">
                    {pkg.offer_price ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${pkg.offer_price}</span>
                        <span className="text-sm text-gray-500 line-through">${pkg.price}</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold">${pkg.price}</span>
                    )}
                  </div>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Full Access to all features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Priority Support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Unlimited Updates</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => router.push(`/dashboard/pay?packageId=${pkg.id}&teacherId=${profile?.user}`)}
                  >
                    Subscribe Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {packages.length === 0 && (
              <div className="col-span-full text-center py-10 text-gray-500">
                No subscription packages available at the moment.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}