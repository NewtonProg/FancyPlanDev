import { useBrand } from '../hooks/useBrand'

type Props = {
  className?: string
  imgClassName?: string
}

export default function BrandLogo({ className = '', imgClassName = 'h-10 w-10 object-contain' }: Props): JSX.Element {
  const { logoData, logoKey } = useBrand()
  const src = logoData ?? `/brand-icons/${logoKey}.png`

  return (
    <div className={className}>
      <img src={src} alt="Logo" className={imgClassName} draggable={false} />
    </div>
  )
}
