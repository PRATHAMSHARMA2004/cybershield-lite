export default function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-cs-surface border border-cs-border rounded-xl2 p-6 shadow-[0_0_20px_rgba(0,0,0,0.25)] ${className}`}
    >
      {children}
    </div>
  );
}
