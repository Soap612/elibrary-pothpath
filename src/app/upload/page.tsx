"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CloudUpload,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  BookOpen,
  Tag,
  FileCheck,
  Shield
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type Genre = {
  id: string
  name: string
  slug: string
  color_code?: string
  is_active: boolean
  sort_order: number
}

type UploadStep = "details" | "upload" | "complete"

export default function UploadPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreId, setGenreId] = useState<string>("")
  const [loadingGenres, setLoadingGenres] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<UploadStep>("details")
  const [isPublic, setIsPublic] = useState(true)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Check if user is logged in
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/login")
        return
      }
      setUser(session.user)
    }
    getSession()
  }, [router])

  // Fetch genres
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true)

      const { data, error } = await supabase
        .from("genres")
        .select("id, name, slug, color_code, is_active, sort_order")
        .eq("is_active", true)
        .order("sort_order")

      if (error) {
        console.error("Error loading genres:", error)
        toast.error("Failed to load genres")
      } else {
        setGenres(data || [])
        if (data && data.length > 0) {
          setGenreId(data[0].id)
        }
      }
      setLoadingGenres(false)
    }

    fetchGenres()
  }, [])

  const validateForm = (step: UploadStep = "details") => {
    const errors: Record<string, string> = {}

    if (step === "details") {
      if (!title.trim()) errors.title = "Title is required"
      if (!author.trim()) errors.author = "Author is required"
      if (!genreId) errors.genre = "Genre is required"
    }

    if (step === "upload" && !file) {
      errors.file = "PDF file is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onFileInput = (f: File | null) => {
    if (!f) return
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file")
      return
    }
    if (f.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error("File size must be less than 50MB")
      return
    }
    setFile(f)
    setFormErrors(prev => ({ ...prev, file: "" }))
  }

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    setDragActive(false)
    const f = e.dataTransfer.files?.[0]
    onFileInput(f || null)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error("Please log in to upload books")
      router.push("/login")
      return
    }

    if (!validateForm("upload")) {
      toast.error("Please fix the form errors before uploading")
      return
    }

    setUploading(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setUploadProgress(0)

    // add 3s delay and then setUploadProgress(10)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setUploadProgress(10)


    try {
      // 1) Upload file to Storage with progress
      const safeTitle = title.trim().replace(/[^a-zA-Z0-9]/g, "_").slice(0, 60)
      const filePath = `${user.id}/${Date.now()}_${safeTitle}.pdf`
      setUploadProgress(30)
      const { error: storageError } = await supabase.storage
        .from("books")
        .upload(filePath, file!, {
          upsert: false,
          cacheControl: '3600'
        })

      await new Promise(resolve => setTimeout(resolve, 1000))
      setUploadProgress(50)

      await new Promise(resolve => setTimeout(resolve, 3000))
      setUploadProgress(70)

      setUploadProgress(80)

      if (storageError) {
        if (storageError.message.includes("Bucket not found")) {
          throw new Error("Storage bucket not found. Please contact administrator.")
        }
        throw storageError
      }

      setUploadProgress(90)

      // 2) Get public URL
      const { data: urlData } = supabase.storage
        .from("books")
        .getPublicUrl(filePath)
      const fileUrl = urlData.publicUrl

      // 3) Insert DB row
      const { error: dbError } = await supabase.from("books").insert([{
        title: title.trim(),
        author: author.trim(),
        description: description.trim() || null,
        file_url: fileUrl,
        genre_id: genreId,
        file_size_bytes: file!.size,
        status: "pending",
        is_public: isPublic,
        upload_by: user.id,
        upload_at: new Date().toISOString()
      }])

      if (dbError) throw dbError

      setUploadProgress(100)

      setCurrentStep("complete")
      toast.success("Book uploaded successfully! It's now pending approval.")

    } catch (err: any) {
      console.error("Upload failed:", err)
      toast.error(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setAuthor("")
    setDescription("")
    setFile(null)
    setCurrentStep("details")
    setUploadProgress(0)
    setFormErrors({})
    if (genres.length > 0) setGenreId(genres[0].id)
  }

  const nextStep = () => {
    if (validateForm("details")) {
      setCurrentStep("upload")
    }
  }

  const prevStep = () => {
    setCurrentStep("details")
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-120px)] py-8 bg-gradient-to-br">
      <div className="max-w-4xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {["details", "upload", "complete"].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${currentStep === step
                  ? "bg-primary border-primary text-primary-foreground"
                  : index < ["details", "upload", "complete"].indexOf(currentStep)
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-muted-foreground/30 bg-background"
                  }`}>
                  {index < ["details", "upload", "complete"].indexOf(currentStep) ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-16 h-1 ${index < ["details", "upload", "complete"].indexOf(currentStep)
                    ? "bg-green-500"
                    : "bg-muted-foreground/30"
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="text-center border-b">
                <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                  <BookOpen className="w-8 h-8" />
                  Upload a Book
                </CardTitle>
                <CardDescription className="text-lg">
                  Share your knowledge with the community
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {currentStep === "complete" ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">Upload Successful!</h3>
                    <p className="text-muted-foreground mb-6">
                      Your book has been uploaded and is pending review. You'll be notified once it's approved.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={resetForm} variant="outline">
                        Upload Another Book
                      </Button>
                      <Button onClick={() => router.push("/")}>
                        Back to Home
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpload} className="space-y-6">
                    {/* Step 1: Book Details */}
                    {currentStep === "details" && (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Title *
                          </Label>
                          <Input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => {
                              setTitle(e.target.value)
                              setFormErrors(prev => ({ ...prev, title: "" }))
                            }}
                            placeholder="Enter book title..."
                            className={formErrors.title ? "border-red-500" : ""}
                          />
                          {formErrors.title && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {formErrors.title}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="author" className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Author *
                          </Label>
                          <Input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(e) => {
                              setAuthor(e.target.value)
                              setFormErrors(prev => ({ ...prev, author: "" }))
                            }}
                            placeholder="Enter author name..."
                            className={formErrors.author ? "border-red-500" : ""}
                          />
                          {formErrors.author && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {formErrors.author}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the book..."
                            className="min-h-[120px] resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            {description.length}/500 characters
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="genre" className="flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Genre *
                          </Label>
                          {loadingGenres ? (
                            <div className="h-10 w-full rounded-md border bg-muted animate-pulse" />
                          ) : (
                            <Select
                              value={genreId}
                              onValueChange={(value) => {
                                setGenreId(value)
                                setFormErrors(prev => ({ ...prev, genre: "" }))
                              }}
                            >
                              <SelectTrigger className={formErrors.genre ? "border-red-500" : ""}>
                                <SelectValue placeholder="Select a genre" />
                              </SelectTrigger>
                              <SelectContent>
                                {genres.map((genre) => (
                                  <SelectItem key={genre.id} value={genre.id}>
                                    <div className="flex items-center gap-2">
                                      {genre.color_code && (
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{ backgroundColor: genre.color_code }}
                                        />
                                      )}
                                      {genre.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {formErrors.genre && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {formErrors.genre}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <Label htmlFor="visibility" className="font-medium">
                                Make book public
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                {isPublic ? "Visible to all users" : "Only visible to you and admins"}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id="visibility"
                            checked={isPublic}
                            onCheckedChange={setIsPublic}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 2: File Upload */}
                    {currentStep === "upload" && (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <FileCheck className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                          <h3 className="text-xl font-semibold">Upload PDF File</h3>
                          <p className="text-muted-foreground">Choose the PDF file you want to share</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="file">PDF File *</Label>
                          <label
                            htmlFor="fileInput"
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                              flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-all
                              ${dragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-muted-foreground/25"}
                              ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
                              ${formErrors.file ? "border-red-500 bg-red-50" : ""}
                            `}
                          >
                            {file ? (
                              <div className="text-center">
                                <FileText className="w-16 h-16 mx-auto mb-3 text-green-600" />
                                <p className="font-medium text-lg">{file.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <Badge variant="secondary" className="mt-2">
                                  PDF Document
                                </Badge>
                              </div>
                            ) : (
                              <div className="text-center">
                                <CloudUpload className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
                                <p className="font-medium text-lg">Drag & drop your PDF here</p>
                                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                                <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span>Max 50MB</span>
                                  <span>•</span>
                                  <span>PDF only</span>
                                </div>
                              </div>
                            )}
                            <input
                              id="fileInput"
                              type="file"
                              accept="application/pdf"
                              onChange={(e) => onFileInput(e.target.files?.[0] || null)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>

                          {formErrors.file && (
                            <p className="text-red-500 text-sm flex items-center gap-1">
                              <AlertCircle className="w-4 h-4" />
                              {formErrors.file}
                            </p>
                          )}

                          {file && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFile(null)}
                              disabled={uploading}
                              className="mt-2"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove File
                            </Button>
                          )}
                        </div>

                        {uploading && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Uploading...</span>
                              <span>{uploadProgress.toFixed(0)}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-2" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-4">
                      {currentStep === "upload" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          disabled={uploading}
                          className="flex-1"
                        >
                          Back
                        </Button>
                      )}

                      {currentStep === "details" ? (
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={!title.trim() || !author.trim() || !genreId}
                          className="flex-1"
                        >
                          Continue to Upload
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={uploading || !file}
                          className="flex-1"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CloudUpload className="w-4 h-4 mr-2" />
                              Upload Book
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upload Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Upload Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Only upload PDF files (max 50MB)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Ensure you have rights to share the content</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Provide accurate title and author information</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>All uploads are reviewed before publishing</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pending Review</span>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Approved</span>
                    <Badge variant="default">0</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Uploads</span>
                    <Badge>0</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}