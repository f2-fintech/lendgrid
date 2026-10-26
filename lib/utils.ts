import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Function to capitalize the first letter of each word in a string
 * @param str - The string to be capitalized
 * @returns
 */
export const capitalizeEachWord = (str: string | undefined) => {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');
};

// Cookie helpers (client-side only)
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null
  return null
}

export function setCookie(name: string, value: string, days = 1): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; Expires=${expires}; Path=/; secure; SameSite=None`
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=None`
}

// Lightweight JWT decoder (no verification; for claims extraction only)
export type DecodedJwt = Record<string, any>;

export function decodeJwt(token: string | null | undefined): DecodedJwt | null {
  if (!token) return null;
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export function createPublicFilePath(file: File, folder: string = "uploads") {
  const cleanName = file.name.replace(/\s+/g, "_");
  const time = Date.now();
  return `/${folder}/${time}-${cleanName}`;
}

/**
 * Normalizes an API URL to always ensure it has the /api/v1 prefix
 * and removes any trailing /graphql if mistakenly passed.
 */
export function normalizeApiUrl(url: string | undefined): string {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  clean = clean.replace(/\/graphql$/i, '');
  if (!clean.endsWith('/api/v1')) {
    clean = `${clean}/api/v1`;
  }
  return clean;
}

export const uploadToS3 = async (file: File, folder: string): Promise<string> => {
  const safeFolderName = (folder || file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueKey = `${Date.now()}_${safeFolderName}`;
  const formData = new FormData();
  formData.append("document", file);
  formData.append("folder", `document/${uniqueKey}`);

  const baseUrl = normalizeApiUrl(process.env.NEXT_PUBLIC_WEB_URL);
  const response = await fetch(`${baseUrl}/upload-to-s3`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let msg = "Failed to upload file";
    try {
      const err = await response.json();
      msg = err.msg || err.message || msg;
    } catch {
      if (response.status === 413) {
        msg = "File is too large. Please upload files under 15MB.";
      } else {
        msg = `Failed to upload file (HTTP ${response.status})`;
      }
    }
    throw new Error(msg);
  }

  const result = await response.json();
  if (!result?.data) {
    throw new Error(result?.msg || result?.message || 'No file URL returned from upload server');
  }
  return result.data; // S3 public URL
};

/**
 * Format date for display with relative time
 * @param dateString - ISO date string
 * @returns Formatted date string with relative time
 */
export const formatDateWithRelative = (dateString: string): string => {
  const dateObj = new Date(dateString)
  return `${format(dateObj, 'dd MMM yyyy HH:mm')} (${formatDistanceToNow(dateObj)} ago)`
}

/**
 * Format date for Indian locale
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDateIndian = (dateString: string): string => {
  const dateObj = new Date(dateString)
  return dateObj.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}
