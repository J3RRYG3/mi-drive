import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('midrive_id_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export async function uploadFileToGcs(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<void> {
  const { data } = await api.post<{ data: { url: string } }>('/api/storage/signed-url', {
    fileName: file.name,
    mimeType: file.type,
    operation: 'upload',
  })

  const signedUrl = data.data.url

  await axios.put(signedUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        onProgress(Math.round((evt.loaded * 100) / evt.total))
      }
    },
  })
}
