import AuthButtons from "@/components/layouts/AuthButtons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <AuthButtons />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
