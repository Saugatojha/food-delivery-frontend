import { useRef, useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'

export default function ImageUpload({ value, onChange, label = 'Image' }) {
  const { showToast } = useToast()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('image', file)
    setUploading(true)
    try {
      const { data } = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      onChange(data.url)
      showToast('Image uploaded', 'success')
    } catch (err) {
      showToast(err?.response?.data?.error || 'Upload failed', 'error')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      <div className="flex items-start gap-3">
        {value ? (
          <img src={value} alt="Preview" className="w-20 h-20 rounded-lg object-cover border" />
        ) : (
          <div className="w-20 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs">No image</div>
        )}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="border border-orange-500 text-orange-500 px-3 py-1.5 rounded text-sm hover:bg-orange-50 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : value ? 'Change image' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-red-500 text-xs hover:underline"
            >
              Remove image
            </button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFile} />
    </div>
  )
}
