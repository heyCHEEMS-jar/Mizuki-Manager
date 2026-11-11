import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, ConfirmDialog } from './ui'

interface CollectionControlsProps {
  itemCount: number
  selectedCount: number
  allSelected: boolean
  partiallySelected: boolean
  loading?: boolean
  addLabel: string
  deleteTitle: string
  deleteDescription?: string
  onSelectAll: (checked: boolean) => void
  onDelete: () => void | Promise<void>
  onAdd: () => void
  children?: ReactNode
}

export const CollectionControls = ({
  itemCount,
  selectedCount,
  allSelected,
  partiallySelected,
  loading,
  addLabel,
  deleteTitle,
  deleteDescription,
  onSelectAll,
  onDelete,
  onAdd,
  children
}: CollectionControlsProps) => {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-h-9 flex-wrap items-center gap-3">
        {itemCount > 0 && (
          <Checkbox checked={allSelected} indeterminate={partiallySelected} onCheckedChange={onSelectAll}>
            {t('common.selectAll')}
          </Checkbox>
        )}
        {selectedCount > 0 && (
          <>
            <span className="text-xs text-muted-foreground">{t('common.selected', { count: selectedCount })}</span>
            <ConfirmDialog
              trigger={
                <Button variant="destructive" size="small" icon={<Trash2 className="size-4" />} disabled={loading}>
                  {t('common.delete')}
                </Button>
              }
              title={deleteTitle}
              description={deleteDescription}
              confirmLabel={t('common.delete')}
              variant="destructive"
              onConfirm={onDelete}
            />
          </>
        )}
        {children}
      </div>
      <Button variant="default" icon={<Plus className="size-4" />} loading={loading} onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  )
}
