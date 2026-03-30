"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/lib/api-client"
import { useAuthStore } from "@/stores/auth-store"
import { ApiError } from "@/types/api"

// Schema for login form
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

// Schema for OTP form
const otpSchema = z.object({
  otp: z.string().length(4, "OTP must be 4 digits").regex(/^\d+$/, "OTP must contain only numbers"),
})

type LoginFormData = z.infer<typeof loginSchema>
type OtpFormData = z.infer<typeof otpSchema>

export default function LoginPage() {
  const router = useRouter()
  const checkAuth = useAuthStore(state => state.checkAuth)
  const [step, setStep] = useState<"login" | "otp">("login")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null)

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  })

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  })

  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      setError("")
      setEmail(data.email)

      console.log('Requesting admin OTP for email:', data.email)
      const response = await authService.requestAdminOtp(data.email)
      console.log('Admin OTP response:', response)

      if (response.status === "success") {
        setOtpExpiry(new Date(response.otpExpiry))
        setStep("otp")
      }
    } catch (err) {
      console.error('Admin OTP request error:', err)
      const error = err as ApiError
      const errorMessage = error.response?.data?.message || error.message || "Failed to request OTP"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const onOtpSubmit = async (data: OtpFormData) => {
    try {
      setIsLoading(true)
      setError("")

      console.log('Verifying admin OTP for email:', email, 'OTP:', data.otp)
      const response = await authService.verifyAdminOtp(email, parseInt(data.otp))

      if (response.status === "success") {
        console.log('Admin login successful, redirecting to dashboard')
        // Fetch user data after successful login
        await checkAuth()
        router.push("/dashboard")
      }
    } catch (err) {
      console.error('Admin OTP verification error:', err)
      const error = err as ApiError
      setError(error.response?.data?.message || "Failed to verify OTP")
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    try {
      setIsLoading(true)
      setError("")

      console.log('Resending admin OTP for email:', email)
      const response = await authService.requestAdminOtp(email)

      if (response.status === "success") {
        setOtpExpiry(new Date(response.otpExpiry))
        setError("")
      }
    } catch (err) {
      console.error('Admin OTP resend error:', err)
      const error = err as ApiError
      setError(error.response?.data?.message || "Failed to resend OTP")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            {step === "login"
              ? "Enter your admin email address to login"
              : "Enter the OTP sent to your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "login" ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@24digi.com"
                  {...loginForm.register("email")}
                  disabled={isLoading}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  placeholder="1234"
                  maxLength={4}
                  {...otpForm.register("otp")}
                  disabled={isLoading}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-500">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {otpExpiry && (
                <p className="text-sm text-gray-500">
                  OTP expires at: {otpExpiry.toLocaleTimeString()}
                </p>
              )}

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Verifying..." : "Verify OTP"}
              </Button>

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep("login")}
                  className="text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={resendOtp}
                  className="text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}