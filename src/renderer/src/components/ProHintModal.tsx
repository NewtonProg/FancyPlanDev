type Props = {
  feature?: string
  onClose: () => void
  onUpgrade: () => void
}

// Hinweis für die kostenlose App: gewählte Funktion ist der Pro-Version vorbehalten.
export default function ProHintModal({ feature, onClose, onUpgrade }: Props): JSX.Element {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="glass-card rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[28px] leading-none mt-0.5">workspace_premium</span>
          <div>
            <p className="text-base font-semibold text-on-surface">Pro-Funktion</p>
            <p className="text-sm text-on-surface-variant/80 mt-1 leading-relaxed">
              {feature ? <><strong className="text-on-surface">{feature}</strong> steht </> : 'Diese Funktionalität steht '}
              in der <strong className="text-on-surface">Pro-Version</strong> zur Verfügung.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
          >
            Schließen
          </button>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 text-sm rounded-lg bg-primary text-on-primary hover:bg-blue-600 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">workspace_premium</span>
            Pro freischalten
          </button>
        </div>
      </div>
    </div>
  )
}
