import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Image src="/logo.png" alt="Respool" width={48} height={48} />
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-jade">
            Respool
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
