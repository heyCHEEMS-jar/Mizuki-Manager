import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
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
}: CollectionControlsProps) => (
	<div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
		<div className="flex min-h-9 flex-wrap items-center gap-3">
			{itemCount > 0 && (
				<Checkbox
					checked={allSelected}
					indeterminate={partiallySelected}
					onCheckedChange={onSelectAll}
				>
					全选
				</Checkbox>
			)}
			{selectedCount > 0 && (
				<>
					<span className="text-xs text-muted-foreground">已选择 {selectedCount} 项</span>
					<ConfirmDialog
						trigger={<Button variant="destructive" size="small" icon={<Trash2 className="size-4" />} disabled={loading}>删除</Button>}
						title={deleteTitle}
						description={deleteDescription}
						confirmLabel="删除"
						variant="destructive"
						onConfirm={onDelete}
					/>
				</>
			)}
			{children}
		</div>
		<Button variant="default" icon={<Plus className="size-4" />} loading={loading} onClick={onAdd}>{addLabel}</Button>
	</div>
)
