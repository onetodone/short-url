import { Injectable } from '@nestjs/common'

export type CounterName =
  | 'cache_hits_total'
  | 'cache_misses_total'
  | 'urls_created_total'
  | 'http_redirects_total'
  | 'clicks_flushed_total'
  | 'clicks_flush_errors_total'

interface CounterMeta {
  name: CounterName
  help: string
}

const COUNTERS: readonly CounterMeta[] = [
  { name: 'cache_hits_total', help: 'Short-code resolutions served from the Redis cache (incl. negative hits)' },
  { name: 'cache_misses_total', help: 'Short-code resolutions that missed the Redis cache and hit Postgres' },
  { name: 'urls_created_total', help: 'Short URLs created via POST /api/v1/urls' },
  { name: 'http_redirects_total', help: 'Successful 301 redirects served by GET /:shortCode' },
  { name: 'clicks_flushed_total', help: 'Buffered clicks reconciled into Postgres by the flush cycle' },
  { name: 'clicks_flush_errors_total', help: 'Click-buffer flush cycles that failed and were re-buffered' },
] as const

@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now()
  private readonly counters = new Map<CounterName, number>(COUNTERS.map(({ name }) => [name, 0]))

  increment(name: CounterName, by = 1): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + by)
  }

  render(): string {
    const lines: string[] = []

    for (const { name, help } of COUNTERS) {
      lines.push(`# HELP ${name} ${help}`)
      lines.push(`# TYPE ${name} counter`)
      lines.push(`${name} ${this.counters.get(name) ?? 0}`)
    }

    const uptimeSeconds = (Date.now() - this.startedAt) / 1000
    lines.push('# HELP process_uptime_seconds Seconds since the metrics registry was initialised')
    lines.push('# TYPE process_uptime_seconds gauge')
    lines.push(`process_uptime_seconds ${uptimeSeconds.toFixed(3)}`)

    return `${lines.join('\n')}\n`
  }
}
