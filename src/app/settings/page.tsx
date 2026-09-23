import Link from "next/link";
import UploadPanel from "@/components/UploadPanel";
import SourceSettings from "@/components/SourceSettings";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between rounded-md bg-sihce-header px-6 py-4 text-white shadow">
        <h1 className="text-lg font-bold">Configuracion</h1>
        <Link href="/" className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
          Volver al dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <SourceSettings />
        <UploadPanel />
      </div>
    </main>
  );
}
