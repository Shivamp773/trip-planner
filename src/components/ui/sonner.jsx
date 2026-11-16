import { Toaster as Sonner } from 'sonner';

// Single app-wide toaster (light theme to match the UI; rich colours for success/error/info).
// Top-centre, just below the sticky header, so toasts never cover the form's main button.
const Toaster = (props) => (
  <Sonner
    theme="light"
    richColors
    position="top-center"
    offset={80}
    className="toaster group"
    toastOptions={{ style: { fontFamily: 'Inter, system-ui, sans-serif' } }}
    {...props}
  />
);

export { Toaster };
