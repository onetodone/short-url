export interface CreatedUrl {
  shortCode: string
  shortUrl: string
  originalUrl: string
  createdAt: Date
  updatedAt: Date
}

export interface UrlSummary {
  shortCode: string
  shortUrl: string
  originalUrl: string
  clicks: number
  createdAt: Date
  updatedAt: Date
}

export interface UrlList {
  items: UrlSummary[]
  total: number
  limit: number
  offset: number
}

export interface ListUrlsOptions {
  limit: number
  offset: number
}
