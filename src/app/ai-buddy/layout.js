import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'AI Security Buddy | SOCBuddy',
  description: 'Chat with an AI assistant about cybersecurity topics',
};

export default function AIBuddyLayout({ children }) {
  return (
    <div>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#252525',
            color: '#e0e0e0',
            border: '1px solid rgba(9,203,177,0.3)'
          },
          className: '',
          custom: {
            light: {
              style: {
                background: 'white',
                color: '#333',
                border: '1px solid rgba(9,203,177,0.5)'
              }
            }
          },
          success: {
            iconTheme: {
              primary: 'rgba(9,203,177,0.823)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff4b4b',
              secondary: 'white',
            },
          }
        }}
      />
      {children}
    </div>
  );
} 