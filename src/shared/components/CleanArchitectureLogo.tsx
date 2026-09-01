/**
 * The course mark: the concentric layers of Clean Architecture — Entities at
 * the core, wrapped by Use Cases, Interface Adapters, and Frameworks & Drivers —
 * with a small inward chevron for the Dependency Rule: source-code dependencies
 * point only inward. Blue rings (#2563EB) with a cyan inward arrow (#06B6D4),
 * matching the course palette. Callers control size via `className`; the brand
 * colours are fixed so the mark looks consistent in both light and dark themes.
 */
export function CleanArchitectureLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
    >
      {/* Frameworks & Drivers — outer layer */}
      <circle cx="12" cy="12" r="9.4" stroke="#2563EB" strokeWidth="1.5" opacity="0.35" />
      {/* Interface Adapters — middle layer */}
      <circle cx="12" cy="12" r="6.3" stroke="#2563EB" strokeWidth="1.5" opacity="0.6" />
      {/* Use Cases — inner layer */}
      <circle cx="12" cy="12" r="3.3" stroke="#2563EB" strokeWidth="1.6" />
      {/* Entities — the core */}
      <circle cx="12" cy="12" r="1.35" fill="#2563EB" />
      {/* The Dependency Rule — dependencies point inward */}
      <path
        d="M10.2 3.5 12 5.4 13.8 3.5"
        stroke="#06B6D4"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
