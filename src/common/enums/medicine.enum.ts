export type SlotStatusType = 'pending' | 'taken' | 'missed' | 'compensated';
export type TimeShiftType = 'morning' | 'noon' | 'afternoon' | 'evening';

export const TIME_SHIFT_VALUES: TimeShiftType[] = ['morning', 'noon', 'afternoon', 'evening'];
export const SLOT_STATUS_VALUES: SlotStatusType[] = ['pending', 'taken', 'missed', 'compensated'];
