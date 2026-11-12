import { fetchEventSource } from '@microsoft/fetch-event-source'
import { notify as message } from '../lib/notify'
import i18n from '../i18n'
import { redirectToLogin } from './util'
import { getResponseMessage, refreshToken, SESSION_CONFLICT_CODE, SESSION_CONFLICT_EVENT } from './request'
import { RefObject } from 'react'
type MethodType = 'GET' | 'POST' | 'PUT' | 'DELETE'
interface SSEParams {
  url: string
  method?: MethodType
  headers?: Record<string, string>
  body?: any
  openWhenHidden?: boolean // 为false时,其他标签页或最小化切回浏览器时会重新发起请求
  onMessage: (data: any) => void
  onDone?: (data: any) => void
  onError?: (data: any) => void
  controllerRef?: RefObject<AbortController> // 外部传入的AbortController引用,用于外部中断请求
}
interface Data {
  code?: number
  success?: boolean
  message?: string
  log?: string
  logEntries?: Data[]
  isHistory?: boolean
  i18nKey?: string
  i18nParams?: Record<string, unknown>
}

const localizeData = (data: Data) => ({ ...data, message: getResponseMessage(data) })
const localizeLog = (data: Data) => (data.i18nKey && i18n.exists(data.i18nKey) ? getResponseMessage(data) : data.log || '')
const localizeLogData = (data: Data) => ({
  ...data,
  log: data.logEntries ? data.logEntries.map(localizeLog).join('') : localizeLog(data)
})

export const createSSE = (params: SSEParams, retryCount: number = 0) => {
  const { url, method = 'POST', headers = {}, body, openWhenHidden = true, onMessage, onDone = () => {}, onError = () => {}, controllerRef } = params
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const ctrl = new AbortController()
  if (controllerRef) {
    controllerRef.current = ctrl
  }
  fetchEventSource(url, {
    method,
    body: body && JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
    signal: ctrl.signal,
    openWhenHidden,
    async onopen(res) {
      const contentType = res.headers.get('Content-Type')
      // 401返回json结果
      if (res.status === 401) {
        // 最多刷新重试3次
        if (retryCount >= 3) {
          message.error(i18n.t('notifications.refreshFailed'))
          await redirectToLogin() // 已经重试过了，仍然401，直接跳转登录页
          controllerRef?.current.abort()
          return
        }
        const success = await refreshToken() // 刷新token
        if (success) {
          controllerRef?.current.abort()
          createSSE(params, retryCount + 1) // 刷新成功，重新发起请求
        }
        return
      }
      // 响应失败或格式为json
      if (!res.ok || contentType?.includes('application/json')) {
        const errData = await res.json()
        if (errData.code === SESSION_CONFLICT_CODE) {
          window.dispatchEvent(new CustomEvent(SESSION_CONFLICT_EVENT, { detail: getResponseMessage(errData) }))
          controllerRef?.current.abort()
          return
        }
        onError(localizeData(errData))
        controllerRef?.current.abort()
        return
      }
    },
    // 接收后端的发送一个带success字段的响应对象判断是否传输完成
    onmessage(msg) {
      const data: Data = JSON.parse(msg.data)
      if (data.success === true) {
        onDone(data.i18nKey ? localizeData(data) : data)
        controllerRef?.current.abort()
        return
      }
      if (data.success === false) {
        onError(localizeData(data))
        controllerRef?.current.abort()
        return
      }
      onMessage(localizeLogData(data))
    },
    onerror(err) {
      console.error(err)
      message.error(i18n.t('notifications.connectionError'))
    }
  })
}
