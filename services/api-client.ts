export type PnlBreakdown = Record<string, string | number | null>

export type PnlResponse = {
  summary?: {
    revenue?: number | null
    totalCosts?: number | null
    netProfit?: number | null
    profitMargin?: number | null
    [key: string]: number | string | null | undefined
  }
  revenue?: number | null
  totalCosts?: number | null
  netProfit?: number | null
  profitMargin?: number | null
  dailyTrend?: Array<Record<string, string | number | null>>
  channelBreakdown?: PnlBreakdown[]
  productBreakdown?: PnlBreakdown[]
  [key: string]: unknown
}

export type Filters = {
  startDate?: string
  endDate?: string
  channel?: string
  status?: string
  paymentMethod?: string
  product?: string
  sku?: string
  state?: string
  city?: string
  search?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '')

function queryString(params?: Record<string, unknown>) {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && !String(value).startsWith('All ')) query.set(key, String(value))
  })
  const result = query.toString()
  return result ? `?${result}` : ''
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured')
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: { ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init?.headers } })
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`)
  return response.json() as Promise<T>
}

export const api = {
  getHealth: () => request<{ status: string }>('/health'),
  getOrders: (filters: Filters = {}) => request('/api/orders' + queryString(filters)),
  getDashboard: (filters: Filters = {}) => request('/api/dashboard' + queryString(filters)),
  getPnl: (filters: Filters = {}) => request<PnlResponse>('/api/pnl' + queryString(filters)),
  getProducts: (filters: Filters = {}) => request('/api/products' + queryString(filters)),
  getChannels: (filters: Filters = {}) => request('/api/channels' + queryString(filters)),
  getDataSource: () => request<{ source: 'csv' | 'mongodb' | 'metabase' }>('/api/data-source'),
  updateDataSource: (source: 'csv' | 'mongodb' | 'metabase') => request('/api/data-source', { method: 'PUT', body: JSON.stringify({ source }) }),
  getMetabaseConfig: () => request<{ url?: string }>('/api/metabase'),
  updateMetabaseConfig: (url: string) => request('/api/metabase', { method: 'PUT', body: JSON.stringify({ url }) }),
  getMetabaseData: () => request('/api/metabase/data'),
  uploadOrders: (file: File) => { const body = new FormData(); body.append('file', file); return request('/api/upload', { method: 'POST', body }) },
  downloadOrders: (filters: Filters = {}, format: 'csv' | 'xlsx' = 'csv') => `${baseUrl}/api/export/orders${queryString({ ...filters, format })}`,
  downloadPnl: (filters: Filters = {}, format: 'csv' | 'xlsx' = 'csv') => `${baseUrl}/api/export/pnl${queryString({ ...filters, format })}`,
}

export const fetcher = <T>(path: string) => request<T>(path)
export { baseUrl }
export { queryString }
