'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Calendar,
  ShieldCheck,
  Lock,
  Loader2,
  MapPin
} from 'lucide-react'
import { api, formatApiError } from '@/lib/api-client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface Profile {
  id: number
  email: string
  username: string
  phone: string
  user_type: string
  name: string
  image: string | null
  branch: string
  department: string
  designation: string
  joining_date: string | null
  status: boolean
}

export default function ProfileSettings() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  })

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const data = await api.get<Profile>('/employee/profile/')
      setProfile(data)
    } catch (err) {
      toast.error('Failed to load profile', {
        description: formatApiError(err)
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      toast.error('All fields are required')
      return
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match')
      return
    }

    setSaving(true)

    try {
      await api.post('/employee/auth/change-password/', {
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      })
      toast.success('Password updated successfully')
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error('Failed to update password', {
        description: formatApiError(err)
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-gray-500 font-medium">Preparing your workspace...</p>
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl space-y-8 min-h-screen">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="relative z-0 flex flex-col md:flex-row items-center gap-8">
          <div className="h-32 w-32 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center text-4xl font-bold shadow-inner">
            {profile.name.charAt(0)}
          </div>
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{profile.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/10 uppercase tracking-wider">
                {profile.designation}
              </span>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold border border-white/10">
                {profile.department}
              </span>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-blue-400/20 blur-2xl" />
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-gray-100/50 rounded-lg border border-gray-200/50 backdrop-blur-sm">
          <TabsTrigger
            value="profile"
            className="rounded-xl px-8 py-4.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all font-bold"
          >
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="rounded-xl px-8 py-4.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 transition-all font-bold"
          >
            Security & Access
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <User size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Profile Details</CardTitle>
                      <CardDescription>View your personal and account information</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Full Name</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold italic">
                        {profile.name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Email Address</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold italic">
                        <Mail size={16} className="text-gray-400" />
                        {profile.email}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Phone Number</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold italic">
                        <Phone size={16} className="text-gray-400" />
                        {profile.phone}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Username</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold italic">
                        @{profile.username}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Employment Context</CardTitle>
                      <CardDescription>Professional placement and role details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Department</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold">
                        <Building2 size={16} className="text-indigo-400" />
                        {profile.department}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Branch Location</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold">
                        <MapPin size={16} className="text-red-400" />
                        {profile.branch}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Join Date</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold">
                        <Calendar size={16} className="text-green-400" />
                        {profile.joining_date ? format(new Date(profile.joining_date), 'MMMM dd, yyyy') : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Role Type</Label>
                      <div className="flex items-center gap-3 h-12 px-4 bg-gray-50 border border-transparent rounded-xl text-gray-900 font-semibold uppercase tracking-wider">
                        {profile.user_type}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className={cn(
                      "inline-flex p-3 rounded-2xl shadow-lg",
                      profile.status ? "bg-green-50 text-green-600 shadow-green-100" : "bg-red-50 text-red-600 shadow-red-100"
                    )}>
                      <ShieldCheck size={32} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 pt-2">Account Status</h3>
                    <div className={cn(
                      "mx-auto w-fit px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                      profile.status ? "bg-green-500 text-white" : "bg-red-500 text-white"
                    )}>
                      {profile.status ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  <div className="h-px bg-gray-100 w-full" />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employee ID</span>
                      <span className="font-bold text-gray-900 text-sm">#{profile.id}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-2">
                <p className="text-blue-700 text-sm font-semibold flex items-center gap-2">
                  <Lock size={14} /> Information Privacy
                </p>
                <p className="text-blue-600/70 text-xs leading-relaxed">
                  Some employment details are system-managed. If you notice inaccuracies, please visit the HR department for updates.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
          <Card className="border-none shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                  <Lock size={20} />
                </div>
                <div>
                  <CardTitle className="text-xl">Authentication Update</CardTitle>
                  <CardDescription>Reset your portal password</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="old_password">Current Password</Label>
                  <div className="relative group">
                    <Input
                      id="old_password"
                      type={showPasswords.old ? 'text' : 'password'}
                      value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      className="h-12 bg-gray-50/50 border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-medium"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} className="text-gray-400" /> Security Requirement
                  </h4>
                  <p className="text-xs text-gray-600 font-medium">
                    Ensure your new password uses mixed character types for maximum security. Never share your credentials.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto h-12 px-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}