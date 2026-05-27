import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import FNowModal from './FNowModal'
import LinkPanel from '../components/LinkPanel'

type TreeNode = {
  id: number; IDParent: number | null; name: string
  level: number; seq: number; path: string; IDTreeRef: number | null
  children: TreeNode[]
}
type Act = Record<string, unknown>

function buildTree(rows: TreeNode[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  const roots: TreeNode[] = []
  for (const r of rows) { map.set(r.id, { ...r, children: [] }) }
  for (const node of map.values()) {
    if (node.IDParent && map.has(node.IDParent)) {
      map.get(node.IDParent)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  const sort = (nodes: TreeNode[]): void => {
    nodes.sort((a, b) => a.seq - b.seq || a.name.localeCompare(b.name, 'de'))
    nodes.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

function TimelineBar({ acts }: { acts: Act[] }): JSX.Element {
  const { t } = useTranslation()
  const dated = acts.filter((a) => a.Pl1Beg)
  if (dated.length === 0) return <p className="text-xs text-on-surface-variant/60 p-4">{t('tree.noPlanData')}</p>

  const dates = dated.flatMap((a) => [String(a.Pl1Beg), String(a.Pl1End ?? a.Pl1Beg)].filter(Boolean))
  const minDate = new Date(dates.reduce((a, b) => a < b ? a : b))
  const maxDate = new Date(dates.reduce((a, b) => a > b ? a : b))
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / 86400000) + 2

  const pct = (d: string): number =>
    ((new Date(d).getTime() - minDate.getTime()) / 86400000 / totalDays) * 100

  const width = (beg: string, end: string): number =>
    Math.max(1, ((new Date(end).getTime() - new Date(beg).getTime()) / 86400000 + 1) / totalDays * 100)

  return (
    <div className="p-4 overflow-x-auto">
      <div className="min-w-0">
        {dated.map((act) => {
          const beg = String(act.Pl1Beg ?? '').slice(0, 10)
          const end = String(act.Pl1End ?? act.Pl1Beg ?? '').slice(0, 10)
          const beg2 = act.Pl2Beg ? String(act.Pl2Beg).slice(0, 10) : null
          const end2 = act.Pl2End ? String(act.Pl2End).slice(0, 10) : null
          const done = Number(act.Sdone) === 1
          return (
            <div key={act.id as number} className="flex items-center gap-2 mb-1.5">
              <div className="w-40 flex-shrink-0 text-xs text-on-surface truncate" title={String(act.Title ?? '')}>
                {String(act.Title ?? '')}
              </div>
              <div className="flex-1 relative h-5 bg-surface-container-high rounded">
                {beg2 && end2 && (
                  <div className="absolute top-1 h-3 bg-outline-variant rounded"
                    style={{ left: `${pct(beg2)}%`, width: `${width(beg2, end2)}%` }} />
                )}
                <div className={`absolute top-0.5 h-4 rounded text-white text-xs flex items-center px-1 truncate ${done ? 'bg-green-400' : 'bg-primary'}`}
                  style={{ left: `${pct(beg)}%`, width: `${width(beg, end)}%` }}
                  title={`${beg} – ${end}`}>
                  {width(beg, end) > 8 ? beg.slice(5) : ''}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type ContextState = { x: number; y: number; node: TreeNode } | null

function ContextMenu({ ctx, onAction, onClose }: {
  ctx: ContextState
  onAction: (action: string, node: TreeNode) => void
  onClose: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  if (!ctx) return null
  const items = [
    { label: t('tree.contextAddChild'), action: 'addChild' },
    { label: t('tree.contextRename'), action: 'rename' },
    { label: '──────────', action: '' },
    { label: t('tree.contextDelete'), action: 'delete', danger: true }
  ]
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/40 py-1 w-44"
        style={{ left: ctx.x, top: ctx.y }}>
        {items.map((item, i) =>
          item.action === '' ? (
            <div key={i} className="border-t border-outline-variant/40 my-1" />
          ) : (
            <button key={i} onClick={() => { onAction(item.action, ctx.node); onClose() }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-container-high ${item.danger ? 'text-error' : 'text-on-surface'}`}>
              {item.label}
            </button>
          )
        )}
      </div>
    </>
  )
}

function TreeNodeItem({ node, activeId, expanded, dragOverId, onToggle, onSelect, onContext, onDragStart, onDragOver, onDrop }: {
  node: TreeNode
  activeId: number | null
  expanded: Set<number>
  dragOverId: number | null
  onToggle: (id: number) => void
  onSelect: (node: TreeNode) => void
  onContext: (e: React.MouseEvent, node: TreeNode) => void
  onDragStart: (id: number) => void
  onDragOver: (id: number) => void
  onDrop: (targetId: number) => void
}): JSX.Element {
  const isExpanded = expanded.has(node.id)
  const isActive = activeId === node.id
  const isDragOver = dragOverId === node.id
  const hasChildren = node.children.length > 0
  const indent = 12 + node.level * 16

  return (
    <div>
      <div
        draggable
        className={`flex items-center gap-1 py-1 pr-2 rounded-lg cursor-pointer select-none transition-colors ${isActive ? 'bg-primary text-on-primary' : isDragOver ? 'bg-blue-100 border border-blue-300' : 'hover:bg-surface-container-highest text-on-surface'}`}
        style={{ paddingLeft: indent }}
        onClick={() => onSelect(node)}
        onContextMenu={(e) => onContext(e, node)}
        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; onDragStart(node.id) }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(node.id) }}
        onDragLeave={(e) => { e.stopPropagation(); onDragOver(-1) }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(node.id) }}
      >
        <span className={`w-4 text-center text-xs flex-shrink-0 ${isActive ? 'text-on-primary' : 'text-on-surface-variant/60'}`}
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id) }}>
          {hasChildren ? (isExpanded ? '▼' : '▶') : '·'}
        </span>
        {node.IDTreeRef && <span className="text-xs mr-0.5">↗</span>}
        <span className="text-sm truncate flex-1">{node.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem key={child.id} node={child} activeId={activeId}
              expanded={expanded} dragOverId={dragOverId}
              onToggle={onToggle} onSelect={onSelect} onContext={onContext}
              onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TreeView(): JSX.Element {
  const { t } = useTranslation()
  const [tree, setTree] = useState<TreeNode[]>([])
  const [flat, setFlat] = useState<TreeNode[]>([])
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null)
  const [acts, setActs] = useState<Act[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list')
  const [ctx, setCtx] = useState<ContextState>(null)
  const [openActId, setOpenActId] = useState<number | null>(null)
  const renameRef = useRef<HTMLInputElement>(null)
  const addRef = useRef<HTMLInputElement>(null)
  const [renaming, setRenaming] = useState<{ id: number; value: string } | null>(null)
  const [adding, setAdding] = useState<{ parentId: number | null; value: string } | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  const [undoStack, setUndoStack] = useState<Array<{ nodeId: number; oldParentId: number | null }>>([])
  const [checkpointMsg, setCheckpointMsg] = useState('')

  const loadTree = useCallback(async () => {
    const rows = await window.db.tree.getAll() as TreeNode[]
    setFlat(rows)
    setTree(buildTree(rows))
  }, [])

  useEffect(() => { loadTree() }, [loadTree])

  const loadActs = useCallback(async (node: TreeNode) => {
    const rows = await window.db.tree.getActivities(node.name)
    setActs(rows)
  }, [])

  const handleSelect = (node: TreeNode): void => {
    setActiveNode(node)
    loadActs(node)
    if (node.IDTreeRef) {
      const refRoot = flat.find((n) => n.id === node.IDTreeRef)
      if (refRoot) setActiveNode(refRoot)
    }
  }

  const handleToggle = (id: number): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleContext = (e: React.MouseEvent, node: TreeNode): void => {
    e.preventDefault()
    setCtx({ x: e.clientX, y: e.clientY, node })
  }

  const handleAddSubmit = async (): Promise<void> => {
    if (!adding || !adding.value.trim()) { setAdding(null); return }
    await window.db.tree.create(adding.parentId, adding.value.trim())
    if (adding.parentId !== null) setExpanded((prev) => new Set([...prev, adding.parentId!]))
    setAdding(null)
    await loadTree()
  }

  const handleAction = async (action: string, node: TreeNode): Promise<void> => {
    if (action === 'addChild') {
      setAdding({ parentId: node.id, value: '' })
      setTimeout(() => addRef.current?.focus(), 50)
    } else if (action === 'rename') {
      setRenaming({ id: node.id, value: node.name })
      setTimeout(() => renameRef.current?.select(), 50)
    } else if (action === 'delete') {
      if (!confirm(t('tree.deleteConfirm', { name: node.name }))) return
      await window.db.tree.delete(node.id)
      if (activeNode?.id === node.id) { setActiveNode(null); setActs([]) }
      await loadTree()
    }
  }

  const handleRenameSubmit = async (): Promise<void> => {
    if (!renaming || !renaming.value.trim()) { setRenaming(null); return }
    await window.db.tree.rename(renaming.id, renaming.value.trim())
    setRenaming(null)
    await loadTree()
  }

  const handleDrop = async (targetId: number): Promise<void> => {
    setDragOverId(null)
    if (dragId === null || dragId === targetId) { setDragId(null); return }
    const nodeId = dragId
    const oldParentId = flat.find((n) => n.id === nodeId)?.IDParent ?? null
    await window.db.tree.move(nodeId, targetId)
    setUndoStack((prev) => [...prev, { nodeId, oldParentId }])
    setDragId(null)
    await loadTree()
  }

  const handleUndo = async (): Promise<void> => {
    if (undoStack.length === 0) return
    const last = undoStack[undoStack.length - 1]
    await window.db.tree.move(last.nodeId, last.oldParentId)
    setUndoStack((prev) => prev.slice(0, -1))
    await loadTree()
  }

  const handleCheckpoint = async (): Promise<void> => {
    try {
      await window.db.backup.create()
      setCheckpointMsg(t('tree.checkpointOk'))
      setTimeout(() => setCheckpointMsg(''), 3000)
    } catch {
      setCheckpointMsg(t('tree.checkpointErr'))
      setTimeout(() => setCheckpointMsg(''), 3000)
    }
  }

  const handleAddRoot = (): void => {
    setAdding({ parentId: null, value: '' })
    setTimeout(() => addRef.current?.focus(), 50)
  }

  return (
    <div className="flex h-full">
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-outline-variant/40">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-outline-variant/40">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{t('tree.title')}</span>
          <div className="flex items-center gap-1">
            {undoStack.length > 0 && (
              <button onClick={handleUndo} title={t('tree.undo')}
                className="text-orange-500 hover:text-orange-600 text-sm leading-none px-1">↩</button>
            )}
            <button onClick={handleCheckpoint} title={t('tree.checkpoint')}
              className="text-on-surface-variant/60 hover:text-secondary-fixed-dim text-sm leading-none px-1">💾</button>
            <button onClick={handleAddRoot}
              className="text-primary hover:text-blue-600 text-lg leading-none" title={t('tree.addRoot')}>+</button>
          </div>
        </div>
        {checkpointMsg && (
          <div className="px-3 py-1 text-xs text-secondary-fixed-dim bg-secondary-container/10 border-b border-green-100">{checkpointMsg}</div>
        )}
        <div className="flex-1 overflow-y-auto p-2">
          {tree.length === 0 && adding === null ? (
            <p className="text-xs text-on-surface-variant/60 p-2">{t('tree.noNodes')}</p>
          ) : tree.map((node) => (
            <TreeNodeItem key={node.id} node={node} activeId={activeNode?.id ?? null}
              expanded={expanded} dragOverId={dragOverId}
              onToggle={handleToggle} onSelect={handleSelect} onContext={handleContext}
              onDragStart={setDragId} onDragOver={setDragOverId} onDrop={handleDrop} />
          ))}
          {adding !== null && (
            <div className="flex items-center gap-1 py-1 pr-2 rounded-lg"
              style={{ paddingLeft: adding.parentId !== null ? 12 + ((flat.find(n => n.id === adding.parentId)?.level ?? 0) + 1) * 16 : 12 }}>
              <span className="w-4 text-center text-xs flex-shrink-0 text-on-surface-variant/60">·</span>
              <input
                ref={addRef}
                className="flex-1 text-sm bg-transparent border-b border-primary/60 outline-none text-on-surface"
                value={adding.value}
                onChange={(e) => setAdding({ ...adding, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubmit()
                  if (e.key === 'Escape') setAdding(null)
                }}
                onBlur={handleAddSubmit}
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {activeNode === null ? (
          <div className="flex items-center justify-center h-full text-on-surface-variant/40 text-sm">
            {t('tree.selectNode')}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-5 py-2.5 border-b border-outline-variant/40">
              {renaming?.id === activeNode.id ? (
                <input ref={renameRef}
                  className="flex-1 text-lg font-semibold bg-transparent border-b border-primary/40 outline-none"
                  value={renaming.value}
                  onChange={(e) => setRenaming({ ...renaming, value: e.target.value })}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setRenaming(null) }} />
              ) : (
                <h2 className="flex-1 text-lg font-semibold text-on-surface">
                  {activeNode.name}
                  <span className="ml-2 text-sm font-normal text-on-surface-variant/60">{t('tree.activities', { count: acts.length })}</span>
                </h2>
              )}
              <div className="flex rounded-lg border border-outline-variant overflow-hidden text-xs">
                {(['list', 'timeline'] as const).map((m) => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`px-3 py-1.5 transition-colors ${viewMode === m ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                    {m === 'list' ? t('tree.list') : t('tree.timeline')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {acts.length === 0 ? (
                <div className="p-6">
                  <p className="text-on-surface-variant/60 text-sm">{t('tree.noActivities')}</p>
                  <LinkPanel entityType="tree" entityId={activeNode.id} />
                </div>
              ) : viewMode === 'timeline' ? (
                <TimelineBar acts={acts} />
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-surface-container-low border-b border-outline-variant">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant">{t('tree.colTitle')}</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-28">{t('tree.colArea')}</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-20">{t('tree.colPrio')}</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant w-32">{t('tree.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acts.map((act, i) => (
                      <tr key={act.id as number}
                        className={`border-b border-outline-variant/40 cursor-pointer hover:bg-primary/5 ${i % 2 === 0 ? 'bg-surface-container' : 'bg-surface-container-low/40'} ${Number(act.Sdone) === 1 ? 'opacity-40' : ''}`}
                        onDoubleClick={() => setOpenActId(act.id as number)}>
                        <td className="px-3 py-1.5 font-medium text-on-surface truncate max-w-0">
                          <div className="truncate">{String(act.Title ?? '')}</div>
                        </td>
                        <td className="px-3 py-1.5 text-xs text-on-surface-variant">{String(act.AreaName ?? '')}</td>
                        <td className="px-3 py-1.5 text-xs text-on-surface-variant">{act.Prio1 ? `P${act.Prio1}` : ''}</td>
                        <td className="px-3 py-1.5 text-xs text-on-surface-variant">{String(act.Status ?? '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {acts.length > 0 && (
                <div className="px-4 pb-4 border-t border-outline-variant/40 pt-3">
                  <LinkPanel entityType="tree" entityId={activeNode.id} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ContextMenu ctx={ctx} onAction={handleAction} onClose={() => setCtx(null)} />

      {openActId !== null && (
        <FNowModal actId={openActId} onClose={() => setOpenActId(null)} formName="FTreeEdit"
          onSaved={(updated) => {
            setActs((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setOpenActId(null)
          }} />
      )}
    </div>
  )
}
