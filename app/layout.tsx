import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'OtterDesk user guide',
    template: '%s | OtterDesk docs',
  },
  description: 'Learn to hire, configure, and supervise AI co-workers in OtterDesk. Step-by-step guides with screenshots from the desktop app.',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
