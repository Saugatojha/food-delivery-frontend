const AUTH_BG = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80'

export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${AUTH_BG})` }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/45" aria-hidden="true" />
      <div className="relative mx-auto flex min-h-[calc(100vh-56px)] max-w-6xl items-center justify-center p-4 sm:p-6">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border bg-white/90 shadow-xl backdrop-blur md:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden bg-orange-600/90 p-8 text-white md:flex md:flex-col md:justify-between">
            <div>
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded bg-white/15 text-2xl font-bold">
                S
              </div>
              <h2 className="text-3xl font-bold leading-tight">Smart Serve</h2>
              <p className="mt-3 text-sm leading-6 text-orange-50">
                Manage orders, menus, and delivery flow from one place.
              </p>
            </div>
            <p className="text-xs text-orange-100">Food delivery management system</p>
          </div>
          <section className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mb-6">{subtitle}</p>}
            {children}
          </section>
        </div>
      </div>
    </div>
  )
}
