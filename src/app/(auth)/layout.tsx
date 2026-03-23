export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-jade">
            ⬡ Respool
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            3D printing filament management
          </p>
        </div>
        <div className="glass-card p-6">{children}</div>
      </div>
    </div>
  );
}
