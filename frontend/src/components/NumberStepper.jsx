export default function NumberStepper({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  placeholder = '1',
  unit,
  style = {},
  disabled = false,
}) {
  const currentVal = value === '' || value === null || value === undefined ? '' : Number(value);

  const handleDecrement = () => {
    const next = (currentVal === '' ? min : currentVal) - step;
    if (min !== undefined && next < min) return;
    onChange(next);
  };

  const handleIncrement = () => {
    const next = (currentVal === '' ? min : currentVal) + step;
    if (max !== undefined && next > max) return;
    onChange(next);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
      return;
    }
    const num = Number(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const isDecDisabled = disabled || (min !== undefined && currentVal !== '' && currentVal <= min);
  const isIncDisabled = disabled || (max !== undefined && currentVal !== '' && currentVal >= max);

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      backgroundColor: 'var(--bg-surface-subtle)',
      borderRadius: '8px',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
      transition: 'border-color 0.18s ease',
      width: '100%',
      ...style,
    }}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={isDecDisabled}
        style={{
          width: '38px',
          height: '38px',
          backgroundColor: 'transparent',
          border: 'none',
          color: isDecDisabled ? 'var(--text-muted)' : 'var(--text-secondary)',
          fontSize: '17px',
          fontWeight: '600',
          cursor: isDecDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isDecDisabled ? 0.35 : 1,
          userSelect: 'none',
          borderRight: '1px solid var(--border-subtle)',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!isDecDisabled) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        −
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '13.5px',
            fontWeight: '600',
            padding: '8px 4px',
            outline: 'none',
            boxShadow: 'none',
          }}
        />
        {unit && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '10px', userSelect: 'none' }}>
            {unit}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={isIncDisabled}
        style={{
          width: '38px',
          height: '38px',
          backgroundColor: 'transparent',
          border: 'none',
          color: isIncDisabled ? 'var(--text-muted)' : 'var(--text-secondary)',
          fontSize: '17px',
          fontWeight: '600',
          cursor: isIncDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isIncDisabled ? 0.35 : 1,
          userSelect: 'none',
          borderLeft: '1px solid var(--border-subtle)',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          if (!isIncDisabled) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        +
      </button>
    </div>
  );
}
