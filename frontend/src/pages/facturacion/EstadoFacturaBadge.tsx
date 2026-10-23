import { StatusBadge, type Tone } from '../../components/common/StatusBadge';
import type { Factura } from '../../types';

const estados: Record<Factura['estado'], { label: string; tone: Tone }> = {
  pagada: { label: 'Pagada', tone: 'success' },
  pendiente: { label: 'Pendiente', tone: 'warning' },
  anulada: { label: 'Anulada', tone: 'danger' },
};

export function EstadoFacturaBadge({ estado }: { estado: Factura['estado'] }) {
  const config = estados[estado] ?? { label: estado, tone: 'neutral' as Tone };
  return <StatusBadge tone={config.tone}>{config.label}</StatusBadge>;
}
