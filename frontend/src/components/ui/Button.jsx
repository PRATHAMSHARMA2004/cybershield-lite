export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-cs-primary hover:opacity-90 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-cs-danger/20 text-cs-danger border border-cs-danger px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`text-cs-muted hover:text-cs-text hover:bg-cs-elevated px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
