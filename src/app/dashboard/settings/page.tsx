"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Settings,
  Gift,
  Info,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import {
  registrationRewardService,
  getSystemInfo,
} from "@/lib/api-client"

interface RegistrationRewardConfig {
  enabled: boolean;
  pointsAmount: number;
  expiryDays: number;
  description?: string;
  lastUpdatedAt?: Date;
  updatedBy?: string;
}

interface UpdateRegistrationRewardDto {
  enabled: boolean;
  pointsAmount: number;
  expiryDays: number;
  description?: string;
}

export default function SettingsPage() {
  const { toast } = useToast()

  // Registration Rewards State
  const [rewardConfig, setRewardConfig] = useState<RegistrationRewardConfig | null>(null)
  const [rewardForm, setRewardForm] = useState<UpdateRegistrationRewardDto>({
    enabled: false,
    pointsAmount: 1000,
    expiryDays: 365,
    description: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // System Info
  const systemInfo = getSystemInfo()

  // Fetch registration reward configuration
  useEffect(() => {
    fetchRewardConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchRewardConfig = async () => {
    try {
      setIsLoading(true)
      const config = await registrationRewardService.getConfiguration()
      setRewardConfig(config)
      setRewardForm({
        enabled: config.enabled,
        pointsAmount: config.pointsAmount,
        expiryDays: config.expiryDays,
        description: config.description || "",
      })
    } catch (error) {
      console.error("Failed to fetch reward configuration:", error)
      toast({
        title: "Error",
        description: "Failed to load registration reward settings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRewardFormChange = (field: keyof UpdateRegistrationRewardDto, value: unknown) => {
    setRewardForm((prev: UpdateRegistrationRewardDto) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
  }

  const handleSaveRewardConfig = async () => {
    try {
      setIsSaving(true)

      // Validate inputs
      if (rewardForm.pointsAmount! < 0) {
        toast({
          title: "Validation Error",
          description: "Points amount must be 0 or greater",
          variant: "destructive",
        })
        return
      }

      if (rewardForm.expiryDays! < 1) {
        toast({
          title: "Validation Error",
          description: "Expiry days must be at least 1",
          variant: "destructive",
        })
        return
      }

      const updatedConfig = await registrationRewardService.updateConfiguration(rewardForm)
      setRewardConfig(updatedConfig)
      setHasChanges(false)

      toast({
        title: "Success",
        description: "Registration reward settings updated successfully",
      })
    } catch (error) {
      console.error("Failed to save reward configuration:", error)
      toast({
        title: "Error",
        description: "Failed to save registration reward settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (rewardConfig) {
      setRewardForm({
        enabled: rewardConfig.enabled,
        pointsAmount: rewardConfig.pointsAmount,
        expiryDays: rewardConfig.expiryDays,
        description: rewardConfig.description || "",
      })
      setHasChanges(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Application Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage system configuration and application settings
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList>
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Registration Rewards
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            System Information
          </TabsTrigger>
        </TabsList>

        {/* Registration Rewards Tab */}
        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Reward Configuration</CardTitle>
              <CardDescription>
                Configure the points reward for new user registrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <>
                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enabled" className="text-base font-semibold">
                        Enable Registration Rewards
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Award points to users when they complete registration
                      </p>
                    </div>
                    <Switch
                      id="enabled"
                      checked={rewardForm.enabled}
                      onCheckedChange={(checked) => handleRewardFormChange("enabled", checked)}
                    />
                  </div>

                  {/* Points Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="pointsAmount">Points Amount</Label>
                    <Input
                      id="pointsAmount"
                      type="number"
                      min="0"
                      step="1"
                      value={rewardForm.pointsAmount}
                      onChange={(e) =>
                        handleRewardFormChange("pointsAmount", parseInt(e.target.value) || 0)
                      }
                      disabled={!rewardForm.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of points to award for new registrations
                    </p>
                  </div>

                  {/* Expiry Days */}
                  <div className="space-y-2">
                    <Label htmlFor="expiryDays">Expiry Days</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      min="1"
                      step="1"
                      value={rewardForm.expiryDays}
                      onChange={(e) =>
                        handleRewardFormChange("expiryDays", parseInt(e.target.value) || 1)
                      }
                      disabled={!rewardForm.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of days until the reward points expire
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="e.g., Welcome bonus for new registration"
                      value={rewardForm.description}
                      onChange={(e) => handleRewardFormChange("description", e.target.value)}
                      disabled={!rewardForm.enabled}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional description displayed to users
                    </p>
                  </div>

                  {/* Last Updated Info */}
                  {rewardConfig && rewardConfig.lastUpdatedAt && (
                    <div className="rounded-lg bg-muted p-4 space-y-1">
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(rewardConfig.lastUpdatedAt).toLocaleString()}
                        {rewardConfig.updatedBy && ` by ${rewardConfig.updatedBy}`}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      {hasChanges && (
                        <div className="flex items-center gap-2 text-sm text-orange-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>You have unsaved changes</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={!hasChanges || isSaving}
                      >
                        Reset
                      </Button>
                      <Button
                        onClick={handleSaveRewardConfig}
                        disabled={!hasChanges || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Information Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Read-only system configuration and environment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Environment */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Environment
                  </Label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        systemInfo.environment === "production"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {systemInfo.environment.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* API URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">API URL</Label>
                  <div className="p-2 bg-muted rounded font-mono text-sm break-all">
                    {systemInfo.apiUrl}
                  </div>
                </div>

                {/* Version */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Version</Label>
                  <div className="p-2 bg-muted rounded font-mono text-sm">
                    {systemInfo.version}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Operational</span>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="rounded-lg bg-blue-50 p-4 mt-6">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Configuration Note
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      System configuration is managed through environment variables.
                      Contact your system administrator to modify core system settings.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Future Settings Placeholder */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Additional Settings</CardTitle>
              <CardDescription>
                More configuration options will be available here in future updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Push Notifications, SMS Settings, Payment Configuration</p>
                <p className="text-sm mt-2">Coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
