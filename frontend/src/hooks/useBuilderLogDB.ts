import { useCallback, useMemo, useRef } from 'react'
import { openDB, DBInstance } from '../utils/database'

export const BUILDER_LOG_MAX_LENGTH = 200_000
export const limitBuilderLog = (log: string) => (log.length > BUILDER_LOG_MAX_LENGTH ? log.slice(-BUILDER_LOG_MAX_LENGTH) : log)

export const useBuilderLogDB = () => {
  const dbRef = useRef<DBInstance>(null)

  const getDB = useCallback(async () => {
    if (dbRef.current) return dbRef.current
    const db = await openDB('builder_log_store')
    dbRef.current = db
    return db
  }, [])

  const saveCache = useCallback(
    async (content: string) => {
      const db = await getDB()
      return db.put({ id: 'latest', content: limitBuilderLog(content) })
    },
    [getDB]
  )

  const getCache = useCallback(async () => {
    const db = await getDB()
    const data = await db.getById('latest')
    const content = typeof data?.content === 'string' ? data.content : ''
    const limitedContent = limitBuilderLog(content)
    if (limitedContent !== content) await db.put({ id: 'latest', content: limitedContent })
    return limitedContent
  }, [getDB])

  const clearCache = useCallback(async () => {
    const db = await getDB()
    return db.put({ id: 'latest', content: '' })
  }, [getDB])

  return useMemo(() => ({ saveCache, getCache, clearCache }), [saveCache, getCache, clearCache])
}
