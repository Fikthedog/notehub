import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'notehub — A little clarity after class', description:'Your classroom notes, all in one place. Revisit board photos, find a topic, and pick up where you left off.' };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
