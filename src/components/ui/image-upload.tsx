"use client"

import React, { useState, useRef, useCallback } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"
import { Label } from "./label"
import { cn } from "@/lib/utils"
import Cookies from "js-cookie"
import Image from "next/image"

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  uploadEndpoint: string
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  maxSize?: number // in MB
}

export function ImageUpload({
  value,
  onChange,
  uploadEndpoint,
  label = "Image",
  placeholder = "Drop an image here or click to browse",
  className,
  disabled = false,
  maxSize = 5,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useUrl, setUseUrl] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null)

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file")
        return
      }

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024
      if (file.size > maxSizeBytes) {
        setError(`File size must be less than ${maxSize}MB`)
        return
      }

      // Upload file
      setIsUploading(true)
      const formData = new FormData()
      formData.append("image", file)

      try {
        const accessToken = Cookies.get("digi_access_token")
        const jwtToken = Cookies.get("digi_jwt_token")

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-JWT-Token": jwtToken || "",
          },
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Upload failed")
        }

        const data = await response.json()
        onChange(data.url)
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to upload image")
      } finally {
        setIsUploading(false)
      }
    },
    [uploadEndpoint, onChange, maxSize]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled || isUploading) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [disabled, isUploading, handleFileSelect]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!disabled && !isUploading) {
        setIsDragging(true)
      }
    },
    [disabled, isUploading]
  )

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFileSelect(file)
      }
    },
    [handleFileSelect]
  )

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setUrlInput("")
      setUseUrl(false)
    }
  }, [urlInput, onChange])

  const handleRemoveImage = useCallback(() => {
    onChange("")
  }, [onChange])

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      {value ? (
        // Image preview
        <div className="relative rounded-lg border border-gray-200 overflow-hidden">
          <Image
            src={value}
            alt="Preview"
            width={400}
            height={192}
            className="w-full h-48 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          {!useUrl ? (
            // File upload area
            <div
              className={cn(
                "relative rounded-lg border-2 border-dashed transition-colors",
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400",
                disabled || isUploading
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
                disabled={disabled || isUploading}
              />

              <div className="flex flex-col items-center justify-center py-8 px-4">
                {isUploading ? (
                  <>
                    <Loader2 className="h-10 w-10 text-gray-400 animate-spin mb-3" />
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 text-center">
                      {placeholder}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: {maxSize}MB
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            // URL input
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Enter image URL"
                disabled={disabled || isUploading}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button
                type="button"
                onClick={handleUrlSubmit}
                disabled={disabled || isUploading || !urlInput.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setUseUrl(false)
                  setUrlInput("")
                }}
                disabled={disabled || isUploading}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Toggle between upload and URL */}
          {!useUrl && (
            <div className="text-center">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={() => setUseUrl(true)}
                disabled={disabled || isUploading}
              >
                Or enter image URL instead
              </button>
            </div>
          )}
        </>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}