import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  Check,
} from 'lucide-react';

interface PremiumDateTimePickerProps {
  value: string; // Format: "YYYY-MM-DDTHH:mm"
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
}

export const PremiumDateTimePicker: React.FC<PremiumDateTimePickerProps> = ({
  value,
  onChange,
  label = 'Publish At',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState<'date' | 'time'>('date');
  const [timeMode, setTimeMode] = useState<'hour' | 'minute'>('hour');

  // Parsed initial states
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(12); // 1-12
  const [selectedMinute, setSelectedMinute] = useState<number>(0); // 0-59
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync internal state when picker opens or value changes
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        let h = d.getHours();
        const period = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        setSelectedHour(h);
        setSelectedMinute(d.getMinutes());
        setSelectedPeriod(period);
        return;
      }
    }
    // Default to nearest future hour
    const now = new Date();
    setSelectedDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
    let nextHour = now.getHours() + 1;
    const period = nextHour >= 24 ? 'AM' : (nextHour >= 12 ? 'PM' : 'AM');
    nextHour = nextHour % 12;
    if (nextHour === 0) nextHour = 12;
    setSelectedHour(nextHour);
    setSelectedMinute(0);
    setSelectedPeriod(period);
  }, [value, isOpen]);

  // Validate the chosen date and time
  const getSelectedDateTimeObj = () => {
    if (!selectedDate) return null;
    const d = new Date(selectedDate);
    let h = selectedHour;
    if (selectedPeriod === 'PM' && h < 12) h += 12;
    if (selectedPeriod === 'AM' && h === 12) h = 0;
    d.setHours(h, selectedMinute, 0, 0);
    return d;
  };

  useEffect(() => {
    const chosen = getSelectedDateTimeObj();
    if (chosen && chosen < new Date()) {
      setValidationError('Cannot schedule a time in the past.');
    } else {
      setValidationError(null);
    }
  }, [selectedDate, selectedHour, selectedMinute, selectedPeriod]);

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const startDay = date.getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isPastDay = (day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day < today;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Clock Geometry & Math
  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handAngle = timeMode === 'hour' 
    ? (selectedHour % 12) * 30 
    : selectedMinute * 6;

  const handleClockClick = (val: number) => {
    if (timeMode === 'hour') {
      setSelectedHour(val);
      // Auto transition to minutes after selection
      setTimeout(() => {
        setTimeMode('minute');
      }, 250);
    } else {
      setSelectedMinute(val);
    }
  };

  const handleConfirm = () => {
    const chosen = getSelectedDateTimeObj();
    if (!chosen) return;
    if (chosen < new Date()) {
      setValidationError('Cannot schedule a time in the past.');
      return;
    }

    // Format local time component to "YYYY-MM-DDTHH:mm"
    let h24 = selectedHour;
    if (selectedPeriod === 'PM' && h24 < 12) h24 += 12;
    if (selectedPeriod === 'AM' && h24 === 12) h24 = 0;

    const y = chosen.getFullYear();
    const m = String(chosen.getMonth() + 1).padStart(2, '0');
    const d = String(chosen.getDate()).padStart(2, '0');
    const hh = String(h24).padStart(2, '0');
    const mm = String(selectedMinute).padStart(2, '0');

    onChange(`${y}-${m}-${d}T${hh}:${mm}`);
    setIsOpen(false);
  };

  // Format visual label for closed button state
  const getFormattedLabel = () => {
    if (!value) return 'Post Immediately (On Save)';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Post Immediately (On Save)';

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let h = d.getHours();
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;

    const hh = String(h).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${hh}:${mm} ${period}`;
  };

  return (
    <div className="space-y-1.5 text-left">
      {label && <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider block">{label}</label>}
      
      <button
        type="button"
        onClick={() => {
          setPhase('date');
          setTimeMode('hour');
          setIsOpen(true);
        }}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs hover:border-white/20 transition-all text-left font-bold cursor-pointer"
      >
        <span className="flex items-center gap-2">
          {value ? <ClockIcon className="w-4 h-4 text-emerald-400" /> : <CalendarIcon className="w-4 h-4 text-zinc-500" />}
          <span>{getFormattedLabel()}</span>
        </span>
        <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-extrabold">Configure</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[99999]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="glass-card w-full max-w-sm p-5 border border-white/10 relative flex flex-col gap-4 text-white overflow-hidden text-left bg-zinc-950/90 rounded-3xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">Schedule Publication</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/8 text-zinc-400 hover:text-white cursor-pointer transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Digital Readout Summary */}
              <div className="bg-white/3 border border-white/5 rounded-2xl p-3 flex flex-col gap-1 items-center justify-center text-center">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Target Publication Time</span>
                <span className="text-sm font-black text-emerald-400">
                  {selectedDate ? selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Date Selected'}
                  {' at '}
                  {String(selectedHour).padStart(2, '0')}:{String(selectedMinute).padStart(2, '0')} {selectedPeriod}
                </span>
              </div>

              {/* Validation Alert */}
              {validationError && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold leading-tight">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Sliding Animation container */}
              <div className="relative min-h-[260px] overflow-hidden">
                <AnimatePresence mode="wait">
                  {phase === 'date' ? (
                    <motion.div
                      key="calendar-phase"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3"
                    >
                      {/* Month Controls */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-zinc-300">
                          {currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-7 h-7 rounded-lg border border-white/8 bg-white/3 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer hover:border-white/15"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-7 h-7 rounded-lg border border-white/8 bg-white/3 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer hover:border-white/15"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Day Name Headers */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <span key={d} className="text-[10px] font-extrabold text-zinc-650 uppercase py-1">{d}</span>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1">
                        {getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth()).map((day, idx) => {
                          if (!day) return <div key={`empty-${idx}`} />;
                          const isSelected = selectedDate && 
                            selectedDate.getFullYear() === day.getFullYear() &&
                            selectedDate.getMonth() === day.getMonth() &&
                            selectedDate.getDate() === day.getDate();
                          const isPast = isPastDay(day);

                          return (
                            <button
                              key={day.toISOString()}
                              type="button"
                              disabled={isPast}
                              onClick={() => {
                                setSelectedDate(day);
                                setPhase('time');
                              }}
                              className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-emerald-500 text-black font-black'
                                  : isPast
                                  ? 'text-zinc-700 cursor-not-allowed opacity-30'
                                  : 'bg-white/3 hover:bg-white/10 text-zinc-300 hover:text-white cursor-pointer'
                              }`}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="time-phase"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col items-center gap-3"
                    >
                      {/* Back button */}
                      <div className="w-full flex justify-start">
                        <button
                          type="button"
                          onClick={() => setPhase('date')}
                          className="flex items-center gap-1 text-[10px] font-black uppercase text-zinc-550 hover:text-white cursor-pointer transition-all"
                        >
                          <ChevronLeft className="w-3 h-3" /> Back to Calendar
                        </button>
                      </div>

                      {/* Time Toggles */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {/* Selector Toggles */}
                        <div className="flex items-center bg-zinc-950 border border-white/5 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => setTimeMode('hour')}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                              timeMode === 'hour'
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-550 hover:text-zinc-300'
                            }`}
                          >
                            Hour
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimeMode('minute')}
                            className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                              timeMode === 'minute'
                                ? 'bg-white/10 text-white'
                                : 'text-zinc-550 hover:text-zinc-300'
                            }`}
                          >
                            Minute
                          </button>
                        </div>

                        {/* Incrementers/readout precision adjustments */}
                        <div className="flex items-center bg-zinc-950 border border-white/5 rounded-xl p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (timeMode === 'hour') {
                                setSelectedHour(prev => (prev === 1 ? 12 : prev - 1));
                              } else {
                                setSelectedMinute(prev => (prev === 0 ? 59 : prev - 1));
                              }
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-black bg-white/3 hover:bg-white/8 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[10px] font-black text-zinc-500 w-12 text-center select-none uppercase">
                            {timeMode === 'hour' ? 'Hour' : 'Min'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (timeMode === 'hour') {
                                setSelectedHour(prev => (prev === 12 ? 1 : prev + 1));
                              } else {
                                setSelectedMinute(prev => (prev === 59 ? 0 : prev + 1));
                              }
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-black bg-white/3 hover:bg-white/8 text-zinc-400 hover:text-white cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Animated Interactive Clock Dial */}
                      <div className="relative w-48 h-48 rounded-full bg-zinc-950 border border-white/8 flex items-center justify-center shadow-inner shadow-black/80">
                        {/* Clock Center Pin */}
                        <div className="w-2 h-2 rounded-full bg-emerald-400 z-20" />

                        {/* Animated Clock Hand line */}
                        <motion.div
                          className="absolute left-1/2 bottom-1/2 w-[2px] bg-emerald-500 origin-bottom z-10"
                          style={{ height: '38%' }}
                          animate={{ rotate: handAngle }}
                          transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                        >
                          {/* Circle dot on end of line */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-400 border border-black shadow-lg flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-black" />
                          </div>
                        </motion.div>

                        {/* Clock Dial numbers */}
                        {timeMode === 'hour' ? (
                          hoursList.map((hr, idx) => {
                            const active = selectedHour === hr;
                            const rad = 38;
                            const angleRad = (idx * 30 * Math.PI) / 180;
                            const x = rad * Math.sin(angleRad);
                            const y = -rad * Math.cos(angleRad);

                            return (
                              <button
                                key={`hr-${hr}`}
                                type="button"
                                onClick={() => handleClockClick(hr)}
                                className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-25 ${
                                  active
                                    ? 'text-emerald-400 scale-110 font-extrabold bg-emerald-500/10'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                                }`}
                                style={{
                                  left: `calc(50% + ${x}%)`,
                                  top: `calc(50% + ${y}%)`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                {hr}
                              </button>
                            );
                          })
                        ) : (
                          minutesList.map((min, idx) => {
                            const active = selectedMinute === min || (selectedMinute >= min && selectedMinute < min + 5 && selectedMinute % 5 !== 0 && selectedMinute === min);
                            const rad = 38;
                            const angleRad = (idx * 30 * Math.PI) / 180;
                            const x = rad * Math.sin(angleRad);
                            const y = -rad * Math.cos(angleRad);

                            return (
                              <button
                                key={`min-${min}`}
                                type="button"
                                onClick={() => handleClockClick(min)}
                                className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer z-25 ${
                                  selectedMinute === min
                                    ? 'text-emerald-400 scale-110 font-extrabold bg-emerald-500/10'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                }`}
                                style={{
                                  left: `calc(50% + ${x}%)`,
                                  top: `calc(50% + ${y}%)`,
                                  transform: 'translate(-50%, -50%)',
                                }}
                              >
                                {String(min).padStart(2, '0')}
                              </button>
                            );
                          })
                        )}
                      </div>

                      {/* AM / PM Selector */}
                      <div className="flex gap-2 w-full max-w-[120px] pt-1">
                        {(['AM', 'PM'] as const).map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setSelectedPeriod(period)}
                            className={`flex-1 py-1.5 rounded-xl border text-xs font-black cursor-pointer transition-all ${
                              selectedPeriod === period
                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/15'
                                : 'bg-white/3 border-white/8 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" /> Post Immediately (On Save)
                </button>
                <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 border border-zinc-800 hover:bg-zinc-900/60 text-zinc-400 font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!!validationError || !selectedDate}
                    onClick={handleConfirm}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs py-2.5 rounded-xl cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Schedule
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
