import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

type TreeNode = {
  id: number; IDParent: number | null; name: string
  level: number; seq: number; path: string; IDTreeRef: number | null
  children: TreeNode[]
}

function buildTree(rows: TreeNode[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  const roots: TreeNode[] = []
  for (const r of rows) map.set(r.id, { ...r, children: [] })
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

function NodeItem({ node, selectedId, expanded, onToggle, onSelect }: {
  node: TreeNode
  selectedId: number | null
  expanded: Set<number>
  onToggle: (id: number) => void
  onSelect: (node: TreeNode) => void
}): JSX.Element {
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedId === node.id
  const hasChildren = node.children.length > 0
  const indent = 8 + node.level * 14

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 pr-2 rounded-lg cursor-pointer select-none ${isSelected ? 'bg-primary text-on-primary' : 'hover:bg-surface-container-high text-on-surface'}`}
        style={{ paddingLeft: indent }}
        onClick={() => onSelect(node)}
      >
        <span className={`w-4 text-center text-xs flex-shrink-0 ${isSelected ? 'text-on-primary' : 'text-on-surface-variant/60'}`}
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggle(node.id) }}>
          {hasChildren ? (isExpanded ? '▼' : '▶') : '·'}
        </span>
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <NodeItem key={child.id} node={child} selectedId={selectedId}
              expanded={expanded} onToggle={onToggle} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TreePickerModal({ current, onConfirm, onClose }: {
  current: string
  onConfirm: (name: string) => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [tree, setTree] = useState<TreeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  useEffect(() => {
    window.db.tree.getAll().then((rows) => {
      const nodes = rows as TreeNode[]
      setTree(buildTree(nodes))
      if (current) {
        const match = nodes.find((n) => n.name === current)
        if (match) {
          setSelectedNode(match)
          const parts = match.path.split('/').filter(Boolean).map(Number)
          setExpanded(new Set(parts.slice(0, -1)))
        }
      }
    })
  }, [current])

  const handleToggle = (id: number): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirm = (): void => {
    if (selectedNode) onConfirm(selectedNode.name)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-surface-container-high rounded-2xl shadow-2xl w-80 flex flex-col max-h-[70vh] border border-outline-variant/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/40">
          <span className="text-sm font-semibold text-on-surface">{t('treepicker.title')}</span>
          <button onClick={onClose} className="text-on-surface-variant/60 hover:text-on-surface text-lg leading-none">✕</button>
        </div>

        {selectedNode && (
          <div className="px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs text-primary truncate">
            {t('treepicker.selected', { name: selectedNode.name })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {tree.length === 0
            ? <p className="text-xs text-on-surface-variant/60 p-2">{t('treepicker.noNodes')}</p>
            : tree.map((node) => (
              <NodeItem key={node.id} node={node} selectedId={selectedNode?.id ?? null}
                expanded={expanded} onToggle={handleToggle} onSelect={setSelectedNode} />
            ))
          }
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-outline-variant/40">
          <button onClick={handleConfirm} disabled={!selectedNode}
            className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-blue-600 disabled:opacity-40">
            {t('treepicker.confirm')}
          </button>
          <button onClick={() => onConfirm('')}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high">
            {t('treepicker.clear')}
          </button>
          <button onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs hover:bg-surface-container-high">
            {t('treepicker.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
