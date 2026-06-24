'use client';

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export { AuthLoadingScreen };
