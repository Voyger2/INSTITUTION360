import { NotFoundView } from "@/components/portal/not-found-view";

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-[70vh] flex items-center justify-center p-6"
    >
      <NotFoundView />
    </main>
  );
}
