import { SegmentedControl } from '../../components/SegmentedControl'
import { LAYOUTS, LAYOUT_IDS } from '../../data/layouts'
import { useKeyFluxStore } from '../../store/useKeyFluxStore'
import type { LayoutId } from '../../types'

const OPTIONS = LAYOUT_IDS.map((id) => ({ value: id, label: LAYOUTS[id].name }))

/** Layout switch — option labels render in the Times New Roman compliance profile. */
export function LayoutSwitcher({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const layout = useKeyFluxStore((s) => s.prefs.layout)
  const setLayout = useKeyFluxStore((s) => s.setLayout)
  return (
    <SegmentedControl<LayoutId>
      size={size}
      compliant
      ariaLabel="Keyboard layout"
      options={OPTIONS}
      value={layout}
      onChange={setLayout}
    />
  )
}
