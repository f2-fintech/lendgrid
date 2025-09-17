"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { settingsApi } from '@/lib/api-client'

const settingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  theme: z.string(),
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function SettingsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsApi.get()
        if (response) {
          setValue('emailNotifications', response.emailNotifications)
          setValue('smsNotifications', response.smsNotifications)
          setValue('theme', response.theme)
        }
      } catch (error) {
        // Handle error
      }
    }
    fetchSettings()
  }, [setValue])

  const onSubmit = async (data: SettingsFormData) => {
    setIsLoading(true)
    try {
      await settingsApi.update(data)
      toast({
        title: 'Success',
        description: 'Settings updated successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="emailNotifications">Email Notifications</Label>
        <Switch id="emailNotifications" {...register('emailNotifications')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="smsNotifications">SMS Notifications</Label>
        <Switch id="smsNotifications" {...register('smsNotifications')} />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </Button>
    </form>
  )
}
