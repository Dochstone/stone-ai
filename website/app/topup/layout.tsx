export default function TopupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`nav, footer, .scroll-to-top { display: none !important; }`}</style>
      {children}
    </>
  );
}
