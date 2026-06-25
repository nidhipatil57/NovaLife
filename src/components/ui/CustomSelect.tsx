import { useState, useEffect, useRef } from 'react';

export interface CustomSelectOption {
  label: string;
  value: string;
  icon?: string;
  colorCircle?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  style,
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div 
      className={`custom-select-container ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`} 
      ref={containerRef}
      style={style}
    >
      <button
        type="button"
        className="custom-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={disabled ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
      >
        <span className="custom-select-trigger-content">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span>{selectedOption.icon}</span>}
              {selectedOption.colorCircle && (
                <span 
                  className="select-color-circle" 
                  style={{ backgroundColor: selectedOption.colorCircle }}
                />
              )}
              <span>{selectedOption.label}</span>
            </>
          ) : (
            placeholder
          )}
        </span>
        {!disabled && <span className="custom-select-chevron">▼</span>}
      </button>

      {isOpen && (
        <div className="custom-select-menu">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.icon && <span>{option.icon}</span>}
              {option.colorCircle && (
                <span 
                  className="select-color-circle" 
                  style={{ backgroundColor: option.colorCircle }}
                />
              )}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
