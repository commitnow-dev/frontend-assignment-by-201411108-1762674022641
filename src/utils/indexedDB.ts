import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { Feed, Creator } from '../types'

const DB_NAME = 'instagram_clone_db'
const DB_VERSION = 1

// DB 스키마 타입 정의
interface FeedDBSchema extends DBSchema {
  feeds: {
    key: string
    value: Feed
    indexes: {
      createdAt: Date
      creatorId: string
    }
  }
  user: {
    key: string
    value: Creator
  }
}

// DB 인스턴스 캐싱
let dbPromise: Promise<IDBPDatabase<FeedDBSchema>> | null = null

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FeedDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 피드 저장소 생성
        if (!db.objectStoreNames.contains('feeds')) {
          const feedStore = db.createObjectStore('feeds', { keyPath: 'id' })
          feedStore.createIndex('createdAt', 'createdAt')
          feedStore.createIndex('creatorId', 'creator.id')
        }

        // 사용자 저장소 생성
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// 현재 사용자 가져오기
export const getCurrentUser = async (): Promise<Creator> => {
  const db = await getDB()
  const users = await db.getAll('user')

  if (users.length > 0) {
    return users[0]
  }

  // 새 사용자 생성
  const newUser: Creator = {
    id: 'user_' + Date.now(),
    name: '나',
  }
  await db.put('user', newUser)
  return newUser
}

// 모든 피드 가져오기 (최신순)
export const getFeeds = async (): Promise<Feed[]> => {
  const db = await getDB()
  const feeds = await db.getAll('feeds')

  return feeds
    .map((feed) => ({
      ...feed,
      createdAt: new Date(feed.createdAt),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

// 피드 저장
export const saveFeed = async (feed: Feed): Promise<void> => {
  const db = await getDB()
  await db.add('feeds', feed)
}

// 내 피드만 가져오기
export const getMyFeeds = async (userId: string): Promise<Feed[]> => {
  const feeds = await getFeeds()
  return feeds.filter((feed) => feed.creator.id === userId)
}

// 특정 피드 가져오기
export const getFeedById = async (id: string): Promise<Feed | undefined> => {
  const db = await getDB()
  const feed = await db.get('feeds', id)

  if (feed) {
    return {
      ...feed,
      createdAt: new Date(feed.createdAt),
    }
  }
  return undefined
}

// 이미지 파일을 Base64로 변환
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// 여러 이미지 파일을 Base64로 변환
export const filesToBase64 = (files: File[]): Promise<string[]> => {
  return Promise.all(files.map(fileToBase64))
}

// 날짜 포맷팅
export const formatDate = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
