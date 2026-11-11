import { useMemo, useState } from 'react'

export const usePagedCollection = <T>(initialPageSize = 12) => {
  const [items, setItemsState] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const pageItems = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize])

  const setItems = (nextItems: T[], nextPage = page, nextPageSize = pageSize) => {
    const pages = Math.max(1, Math.ceil(nextItems.length / nextPageSize))
    setItemsState(nextItems)
    setPage(Math.min(Math.max(1, nextPage), pages))
    setPageSize(nextPageSize)
    setSelected(new Set())
  }

  const changePage = (nextPage: number, nextPageSize: number) => {
    setPage(nextPage)
    setPageSize(nextPageSize)
    setSelected(new Set())
  }

  const setItemSelected = (index: number, checked: boolean) => {
    setSelected(current => {
      const next = new Set(current)
      if (checked) next.add(index)
      else next.delete(index)
      return next
    })
  }

  const toggleItem = (index: number) => {
    setSelected(current => {
      const next = new Set(current)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }
  const selectAll = (checked: boolean) => setSelected(checked ? new Set(pageItems.map((_, index) => index)) : new Set())
  const selectedItems = pageItems.filter((_, index) => selected.has(index))

  return {
    items,
    pageItems,
    page,
    pageSize,
    selected,
    selectedItems,
    allSelected: pageItems.length > 0 && selected.size === pageItems.length,
    partiallySelected: selected.size > 0 && selected.size < pageItems.length,
    setItems,
    changePage,
    setItemSelected,
    toggleItem,
    selectAll
  }
}
