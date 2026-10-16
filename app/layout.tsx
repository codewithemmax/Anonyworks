import '../frontend/src/index.css';

export const metadata = {
  title: 'AnonyWorks',
  description: 'Anonymous feedback that helps people speak honestly.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
