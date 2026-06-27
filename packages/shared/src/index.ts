export interface UserFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  gcsPath: string;
  uploadedAt: Date;
  userId: string;
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface SignedUrlRequest {
  fileName: string;
  mimeType: string;
  operation: 'upload' | 'download';
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: Date;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
