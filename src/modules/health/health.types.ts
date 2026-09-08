export type ComponentStatus = 'up' | 'down'

export interface ReadinessReport {
  status: 'ok' | 'degraded'
  database: ComponentStatus
  redis: ComponentStatus
}
