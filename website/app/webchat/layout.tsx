export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`nav, footer, .scroll-to-top { display: none !important; } main { padding: 0 !important; }`}</style>
      {children}
    </>
  );
}
