'use client'

import React, { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, Users, BookOpen, School, Calendar, CalendarCheck, ClipboardCheck, FileText, CreditCard, ListTodo, ListTodoIcon, UserRoundCheckIcon, RadioIcon } from 'lucide-react'
import Cookies from 'js-cookie'
import Image from 'next/image'

export default function DashSideBar() {
  const pathname = usePathname()
  const [userType, setUserType] = useState<string | null>(null)

  useEffect(() => {
    const user = Cookies.get('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        setUserType(userData.user_type)
      } catch (error) {
        console.error('Error parsing user cookie:', error)
      }
    }
  }, [])

  const teacherMenuItems = [
    { title: 'Dashboard', icon: <Home size={20} />, href: '/dashboard' },
    { title: 'Attendance', icon: <UserRoundCheckIcon size={20} />, href: '/dashboard/attendance' },
    { title: 'Task', icon: <ListTodoIcon size={20} />, href: '/dashboard/task' },
    { title: 'Keep Connect', icon: <RadioIcon size={20} />, href: '/dashboard/keep-connect' },
  ]

  const adminMenuItems = [
    { title: 'Overview', icon: <Home size={20} />, href: '/dashboard' },
    { title: 'Teacher Management', icon: <Users size={20} />, href: '/dashboard/teachers' },
    { title: 'Subscription & Billing', icon: <CreditCard size={20} />, href: '/dashboard/subscription' },
  ]

  const menuItems = userType === 'admin' ? adminMenuItems : teacherMenuItems

  return (
    <Sidebar>
      <SidebarHeader>
        <div className='p-2.5 border-b border-dashed border-gray-200'>
          <Link href={`/`} className='flex flex-row items-center justify-center gap-2.5 p-1'>
            {/* <Image
              src="/images/logo-lg.png"
              alt="hrmian Logo"
              width={128}
              height={128}
            /> */}
            <p className='font-bold text-xl text-[#007BF3]'>HRMian</p>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={'gap-2.5'}>
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.href}
                        className={`gap-3.5 h-10 px-4 !rounded-full hover:!text-white transition-colors ${isActive
                          ? 'bg-[#007BF3] text-white hover:!bg-[#007bf3ad]'
                          : 'hover:!bg-[#007bf3ad] hover:!text-white'
                          }`}
                      >
                        <span>{item.icon}</span>
                        <span className='text-base'>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}