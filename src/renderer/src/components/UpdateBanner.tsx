import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { UpdateStatus } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { useT } from '@renderer/i18n/useT'

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [busy, setBusy] = useState(false)
  const t = useT()

  useEffect(() => {
    return api.update.onStatus(setStatus)
  }, [])

  if (status.state === 'idle' || status.state === 'checking' || status.state === 'not-available' || status.state === 'error') {
    return null
  }

  async function handleDownload() {
    setBusy(true)
    try {
      await api.update.download()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-none items-center justify-between gap-3 border-b border-primary/30 bg-primary/10 px-6 py-2 text-xs">
      {status.state === 'available' && (
        <>
          <div className="text-text-muted">{t('update.available', { version: status.version })}</div>
          <Button size="sm" variant="secondary" onClick={handleDownload} disabled={busy}>
            <Download size={13} /> {busy ? t('update.starting') : t('update.download')}
          </Button>
        </>
      )}
      {status.state === 'downloading' && (
        <>
          <div className="flex items-center gap-2 text-text-muted">
            <RefreshCw size={13} className="animate-spin" /> {t('update.downloading', { percent: status.percent })}
          </div>
        </>
      )}
      {status.state === 'downloaded' && (
        <>
          <div className="text-text-muted">{t('update.ready', { version: status.version })}</div>
          <Button size="sm" onClick={() => api.update.install()}>
            {t('update.restartNow')}
          </Button>
        </>
      )}
    </div>
  )
}
