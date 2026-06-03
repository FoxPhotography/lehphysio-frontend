import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, onComplete, disabled }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 6 digits (padded with empty strings)
  const codeArray = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    const val = e.target.value;
    const numericVal = val.replace(/[^0-9]/g, ''); // Allow only digits

    // If the user pasted a longer string directly into one of the boxes
    if (numericVal.length > 1) {
      const code = numericVal.slice(0, 6);
      onChange(code);
      if (code.length === 6 && onComplete) {
        onComplete(code);
      }
      // Focus the last input box after pasting
      const focusIndex = Math.min(code.length - 1, 5);
      inputsRef.current[focusIndex]?.focus();
      return;
    }

    if (!numericVal) {
      // If cleared
      const newCode = [...codeArray];
      newCode[index] = '';
      onChange(newCode.join(''));
      return;
    }

    // Take the last character entered
    const digit = numericVal.slice(-1);
    const newCode = [...codeArray];
    newCode[index] = digit;
    const combined = newCode.join('');
    onChange(combined);

    // Auto-focus next input
    if (index < 5 && digit) {
      inputsRef.current[index + 1]?.focus();
    }

    // Trigger onComplete if code is full
    if (combined.length === 6 && onComplete) {
      onComplete(combined);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;
    if (e.key === 'Backspace') {
      if (!codeArray[index] && index > 0) {
        // Current box is already empty; focus previous and clear it
        const newCode = [...codeArray];
        newCode[index - 1] = '';
        onChange(newCode.join(''));
        inputsRef.current[index - 1]?.focus();
      } else {
        // Clear current box
        const newCode = [...codeArray];
        newCode[index] = '';
        onChange(newCode.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digitsOnly = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
    onChange(digitsOnly);

    // Focus the appropriate input box after pasting
    const focusIndex = Math.min(digitsOnly.length - 1, 5);
    inputsRef.current[focusIndex]?.focus();

    if (digitsOnly.length === 6 && onComplete) {
      onComplete(digitsOnly);
    }
  };

  return (
    <div className="flex gap-2.5 justify-center mb-6 direction-ltr">
      {codeArray.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => { inputsRef.current[idx] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`w-11 h-13 md:w-12 md:h-14 bg-zinc-900/60 border border-zinc-800 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/30 text-white rounded-xl text-xl font-black text-center outline-none transition-all duration-200 shadow-md ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          required
        />
      ))}
    </div>
  );
};
