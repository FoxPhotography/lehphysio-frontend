import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (e: { target: { value: string } }) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  onBlur?: () => void;
  autoFocus?: boolean;
  'aria-label'?: string;
}

function extractOptionsFromChildren(children: React.ReactNode): SelectOption[] {
  const result: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    if (child.type === React.Fragment) {
      result.push(...extractOptionsFromChildren((child.props as any).children));
      return;
    }
    if (child.type === 'option') {
      const props = child.props as { value?: string | number; disabled?: boolean; children?: React.ReactNode };
      const val = props.value !== undefined ? String(props.value) : String(props.children ?? '');
      result.push({
        value: val,
        label: props.children ?? val,
        disabled: Boolean(props.disabled),
      });
    }
  });
  return result;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  children,
  placeholder = 'اختر...',
  className = '',
  disabled = false,
  onBlur,
  autoFocus = false,
  'aria-label': ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUp: boolean }>({
    top: 0,
    left: 0,
    width: 200,
    openUp: false,
  });

  const parsedOptions = useMemo(
    () => (options ? options : extractOptionsFromChildren(children)),
    [options, children]
  );

  const strValue = value === undefined || value === null ? '' : String(value);
  const selected = parsedOptions.find((o) => o.value === strValue);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = Math.min(248, parsedOptions.length * 40 + 16);
    const openUp = spaceBelow < menuHeight && rect.top > spaceBelow;
    const minMenuWidth = Math.min(window.innerWidth - 24, Math.max(rect.width, 210));
    const clampedLeft = Math.max(12, Math.min(rect.left, window.innerWidth - minMenuWidth - 12));
    setCoords({
      top: openUp ? rect.top - 6 : rect.bottom + 6,
      left: clampedLeft,
      width: minMenuWidth,
      openUp,
    });
  };

  useEffect(() => {
    if (autoFocus && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
        onBlur?.();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        onBlur?.();
      }
    };
    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [open, parsedOptions.length]);

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange({ target: { value: opt.value } });
    setOpen(false);
    onBlur?.();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => {
          if (disabled) return;
          if (!open) updatePosition();
          setOpen((prev) => !prev);
        }}
        className={`flex items-center justify-between gap-2 text-start cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          className ||
          'w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] hover:border-white/20 focus:outline-none focus:border-brand-orange/60'
        }`}
      >
        <span className={`truncate ${selected ? '' : 'text-zinc-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-brand-orange' : ''
          }`}
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <m.div
                ref={menuRef}
                role="listbox"
                initial={{ opacity: 0, y: coords.openUp ? 8 : -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: coords.openUp ? 8 : -8, scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: coords.openUp ? undefined : coords.top,
                  bottom: coords.openUp ? window.innerHeight - coords.top : undefined,
                  left: coords.left,
                  width: coords.width,
                  zIndex: 100000,
                }}
                className="rounded-xl bg-zinc-900/95 backdrop-blur-xl border border-white/15 shadow-[0_18px_50px_rgba(0,0,0,0.75)] p-1.5 max-h-60 overflow-y-auto"
              >
                {parsedOptions.map((opt) => {
                  const isSelected = opt.value === strValue;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-[13px] font-bold text-start transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'bg-brand-orange/15 text-brand-orange'
                          : 'text-zinc-200 hover:bg-white/8 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />}
                    </button>
                  );
                })}
              </m.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};
