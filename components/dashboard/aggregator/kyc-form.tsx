"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { kycApi } from '@/lib/misc-apis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const kycSchema = z.object({
  aadhaarNumber: z.string().min(12, 'Aadhaar must be 12 digits').max(12, 'Aadhaar must be 12 digits'),
  aadhaarFront: z.any(),
  aadhaarBack: z.any(),
  panNumber: z.string().min(10, 'PAN must be 10 characters').max(10, 'PAN must be 10 characters'),
  panImage: z.any(),
  gstNumber: z.string().min(15, 'GST must be 15 digits').max(15, 'GST must be 15 digits'),
  gstCertificate: z.any(),
  companyRegistrationNumber: z.string().optional(),
  companyRegistrationCertificate: z.any().optional(),
})

type KycFormData = z.infer<typeof kycSchema>

export function KycForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null)
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null)
  const [panImagePreview, setPanImagePreview] = useState<string | null>(null)
  const [gstCertificatePreview, setGstCertificatePreview] = useState<string | null>(null)
  const [companyRegistrationCertificatePreview, setCompanyRegistrationCertificatePreview] = useState<string | null>(null)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  })

  useEffect(() => {
    const fetchKyc = async () => {
      try {
        const response: any = await kycApi.get()
        if (response) {
          Object.entries(response).forEach(([key, value]) => {
            setValue(key as keyof KycFormData, value)
          })
          setAadhaarFrontPreview(response.aadhaarFront)
          setAadhaarBackPreview(response.aadhaarBack)
          setPanImagePreview(response.panImage)
          setGstCertificatePreview(response.gstCertificate)
          setCompanyRegistrationCertificatePreview(response.companyRegistrationCertificate)
        }
      } catch (error) {
        // Handle error
      }
    }
    fetchKyc()
  }, [setValue])

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const onSubmit = async (data: KycFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        ...data,
        aadhaarFront: data.aadhaarFront[0] ? await toBase64(data.aadhaarFront[0]) : undefined,
        aadhaarBack: data.aadhaarBack[0] ? await toBase64(data.aadhaarBack[0]) : undefined,
        panImage: data.panImage[0] ? await toBase64(data.panImage[0]) : undefined,
        gstCertificate: data.gstCertificate[0] ? await toBase64(data.gstCertificate[0]) : undefined,
        companyRegistrationCertificate: data.companyRegistrationCertificate[0] ? await toBase64(data.companyRegistrationCertificate[0]) : undefined,
      };
      await kycApi.create(payload)
      toast({
        title: 'Success',
        description: 'KYC documents submitted successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit KYC documents. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Aadhaar Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Aadhaar Details</CardTitle>
          <CardDescription className="text-gray-400">
            Please provide your Aadhaar number and upload images of the front and back.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="aadhaarNumber" className="text-gray-300">Aadhaar Number</Label>
            <Input id="aadhaarNumber" {...register('aadhaarNumber')} className="glass-input" placeholder="Enter 12-digit Aadhaar number" />
            {errors.aadhaarNumber && <p className="text-red-400 text-sm mt-1">{errors.aadhaarNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaarFront" className="text-gray-300">Aadhaar Front Image</Label>
            <Input id="aadhaarFront" type="file" {...register('aadhaarFront')} className="file-input" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setAadhaarFrontPreview(URL.createObjectURL(file))
              }
            }} />
            {aadhaarFrontPreview && <img src={aadhaarFrontPreview} alt="Aadhaar Front Preview" className="mt-2 h-32" />}
            {errors.aadhaarFront && <p className="text-red-400 text-sm mt-1">{errors.aadhaarFront.message as string}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadhaarBack" className="text-gray-300">Aadhaar Back Image</Label>
            <Input id="aadhaarBack" type="file" {...register('aadhaarBack')} className="file-input" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setAadhaarBackPreview(URL.createObjectURL(file))
              }
            }} />
            {aadhaarBackPreview && <img src={aadhaarBackPreview} alt="Aadhaar Back Preview" className="mt-2 h-32" />}
            {errors.aadhaarBack && <p className="text-red-400 text-sm mt-1">{errors.aadhaarBack.message as string}</p>}
          </div>
        </CardContent>
      </Card>

      {/* PAN Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">PAN Card Details</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your PAN number and upload a clear image of your PAN card.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="panNumber" className="text-gray-300">PAN Card Number</Label>
            <Input id="panNumber" {...register('panNumber')} className="glass-input" placeholder="Enter 10-character PAN" />
            {errors.panNumber && <p className="text-red-400 text-sm mt-1">{errors.panNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="panImage" className="text-gray-300">PAN Card Image</Label>
            <Input id="panImage" type="file" {...register('panImage')} className="file-input" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setPanImagePreview(URL.createObjectURL(file))
              }
            }} />
            {panImagePreview && <img src={panImagePreview} alt="PAN Card Preview" className="mt-2 h-32" />}
            {errors.panImage && <p className="text-red-400 text-sm mt-1">{errors.panImage.message as string}</p>}
          </div>
        </CardContent>
      </Card>

      {/* GST Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">GST Details</CardTitle>
          <CardDescription className="text-gray-400">
            Provide your GST number and a copy of your GST certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gstNumber" className="text-gray-300">GST Number</Label>
            <Input id="gstNumber" {...register('gstNumber')} className="glass-input" placeholder="Enter 15-digit GSTIN" />
            {errors.gstNumber && <p className="text-red-400 text-sm mt-1">{errors.gstNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gstCertificate" className="text-gray-300">GST Certificate</Label>
            <Input id="gstCertificate" type="file" {...register('gstCertificate')} className="file-input" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setGstCertificatePreview(URL.createObjectURL(file))
              }
            }} />
            {gstCertificatePreview && <img src={gstCertificatePreview} alt="GST Certificate Preview" className="mt-2 h-32" />}
            {errors.gstCertificate && <p className="text-red-400 text-sm mt-1">{errors.gstCertificate.message as string}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Company Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Company Details (Optional)</CardTitle>
          <CardDescription className="text-gray-400">
            If applicable, provide your company's registration details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyRegistrationNumber" className="text-gray-300">Company Registration Number</Label>
            <Input id="companyRegistrationNumber" {...register('companyRegistrationNumber')} className="glass-input" placeholder="e.g., CIN or FCRN" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyRegistrationCertificate" className="text-gray-300">Company Registration Certificate</Label>
            <Input id="companyRegistrationCertificate" type="file" {...register('companyRegistrationCertificate')} className="file-input" onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0]
                setCompanyRegistrationCertificatePreview(URL.createObjectURL(file))
              }
            }} />
            {companyRegistrationCertificatePreview && <img src={companyRegistrationCertificatePreview} alt="Company Registration Certificate Preview" className="mt-2 h-32" />}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Submitting...' : 'Submit KYC'}
        </Button>
      </div>
    </form>
  )
}
