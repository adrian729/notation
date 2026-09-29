import { useSyncExternalStore } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INSTRUMENTS, isInstrumentId } from '@/lib/instruments';
import { getInstrument, setInstrument, subscribeInstrument } from '@/lib/sound';

export function InstrumentSelect() {
  const instrument = useSyncExternalStore(subscribeInstrument, getInstrument, getInstrument);
  return (
    <Select value={instrument} onValueChange={(value) => isInstrumentId(value) && setInstrument(value)}>
      <SelectTrigger size="sm" className="w-28" aria-label="Instrument">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end">
        {INSTRUMENTS.map(({ id, label }) => (
          <SelectItem key={id} value={id}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
