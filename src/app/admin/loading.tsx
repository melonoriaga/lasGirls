export default function AdminLoading() {
  return (
    <section className="grid min-h-[50vh] place-items-center">
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
        Cargando sección...
      </div>
    </section>
  );
}
