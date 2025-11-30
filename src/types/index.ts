export interface Creator {
  id: string
  name: string
}

export interface Feed {
  id: string
  content: string
  imageUrls: string[]
  hashtags?: string[]
  creator: Creator
  createdAt: Date
}

export interface FeedFormData {
  content: string
  images: File[]
  hashtags: string
}

export type PageType = 'feed' | 'upload' | 'myFeed'
