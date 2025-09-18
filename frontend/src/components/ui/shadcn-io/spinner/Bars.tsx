import { Spinner } from '.'

interface BarsProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const Bars: React.FC<BarsProps> = ({ size = 'md', className }) => {
  return (
    <Spinner variant='bars' size={size} className={className} />
  )
}

export default Bars