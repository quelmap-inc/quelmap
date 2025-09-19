import { useState } from 'react'
import { useSettings } from '@/context/settings-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings as SettingsIcon } from 'lucide-react'

export function Setting() {
  const { baseUrl, apiKey, setBaseUrl, setApiKey, resetSettings } = useSettings()
  const [open, setOpen] = useState(false)
  const [tempBaseUrl, setTempBaseUrl] = useState(baseUrl)
  const [tempApiKey, setTempApiKey] = useState(apiKey)

  const onSave = () => {
    setBaseUrl(tempBaseUrl.trim())
    setApiKey(tempApiKey.trim())
    setOpen(false)
  }

  const onReset = () => {
    resetSettings()
    setTempBaseUrl('http://localhost:11434')
    setTempApiKey('')
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings" title="Settings">
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="base_url">Base URL</Label>
            <Input
              id="base_url"
              placeholder="https://example.com"
              value={tempBaseUrl}
              onChange={(e) => setTempBaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              placeholder="sk-..."
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
            />
          </div>
          <div className="flex justify-between gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={onReset}>Reset</Button>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={onSave}>Save</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
