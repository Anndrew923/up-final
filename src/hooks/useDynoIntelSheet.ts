import { useCallback, useState } from 'react';

export interface DynoIntelSheetState {
  open: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
}

export function useDynoIntelSheet(): DynoIntelSheetState {
  const [open, setOpen] = useState(false);

  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);
  const toggleSheet = useCallback(() => setOpen((value) => !value), []);

  return { open, openSheet, closeSheet, toggleSheet };
}
