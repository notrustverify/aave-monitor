import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './App.css';
import browserAPI from './utils/browserAPI';

// Side Panel specific component
const SidePanel: React.FC = () => {
  // Set document title and notify background script when side panel is opened/closed
  useEffect(() => {    
    // Add a class to the body for side panel specific styling
    document.body.classList.add('sidepanel-body');
    
    // Notify background script that side panel is opened
    browserAPI.runtime.sendMessage({ action: 'sidePanelOpened' })
      .then(response => {
        console.log('Side panel opened notification sent:', response);
      })
      .catch(error => {
        console.error('Error sending side panel opened notification:', error);
      });
    
    return () => {
      document.body.classList.remove('sidepanel-body');
      
      // Notify background script that side panel is closed
      browserAPI.runtime.sendMessage({ action: 'sidePanelClosed' })
        .catch(error => {
          console.error('Error sending side panel closed notification:', error);
        });
    };
  }, []);

  return (
    <div className="sidepanel-container">
      <h3 className="sidepanel-title">Aave Monitor</h3>
      <App />
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
); 