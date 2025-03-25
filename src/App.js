

// import { makeStyles } from "@material-ui/core";
// import { useEffect, useState } from "react"; // Added useState
// import Homepage from "./Pages/HomePage";
// import "./App.css";
// import { BrowserRouter, Route } from "react-router-dom";
// import CoinPage from "./Pages/CoinPage";
// import Header from "./components/Header";
// import { register } from "./serviceWorkerRegistration"; // Added service worker registration

// const useStyles = makeStyles(() => ({
//   App: {
//     backgroundColor: "#14161a",
//     color: "white",
//     minHeight: "100vh",
//   },
//   installButton: {
//     position: "fixed",
//     bottom: "20px",
//     right: "20px",
//     backgroundColor: "#61dafb",
//     color: "#14161a",
//     padding: "10px 20px",
//     borderRadius: "5px",
//     border: "none",
//     cursor: "pointer",
//     zIndex: 1000,
//     "&:hover": {
//       backgroundColor: "#4fa8d3",
//     },
//   },
// }));

// function App() {
//   const classes = useStyles();
//   const [deferredPrompt, setDeferredPrompt] = useState(null); // State for install prompt
//   const [showInstallButton, setShowInstallButton] = useState(false);

//   // Register service worker
//   useEffect(() => {
//     register({
//       onUpdate: (registration) => {
//         console.log('New version available!');
//         if (window.confirm('New version available. Update now?')) {
//           registration.waiting.postMessage({ action: 'SKIP_WAITING' });
//           window.location.reload();
//         }
//       },
//       onSuccess: (registration) => {
//         console.log('Service worker registered successfully');
//       }
//     });
//   }, []);

//   // PWA install prompt handler
//   useEffect(() => {
//     const handler = (e) => {
//       e.preventDefault();
//       setDeferredPrompt(e);
//       setShowInstallButton(true);
//     };

//     window.addEventListener('beforeinstallprompt', handler);

//     return () => {
//       window.removeEventListener('beforeinstallprompt', handler);
//     };
//   }, []);

//   const handleInstallClick = () => {
//     if (!deferredPrompt) return;
    
//     deferredPrompt.prompt();
//     deferredPrompt.userChoice.then((choiceResult) => {
//       if (choiceResult.outcome === 'accepted') {
//         console.log('User accepted the install prompt');
//       } else {
//         console.log('User dismissed the install prompt');
//       }
//       setDeferredPrompt(null);
//       setShowInstallButton(false);
//     });
//   };


//   const activateBackgroundSync = async () => {
//     if ('SyncManager' in window) {
//       try {
//         const registration = await navigator.serviceWorker.ready;
//         await registration.sync.register('update-crypto-data');
//         console.log('Background Sync registered');
//       } catch (err) {
//         console.error('Background Sync registration failed:', err);
//       }
//     }
//   };
  

//   return (
//     <BrowserRouter>
//       <div className={classes.App}>
//         <Header />
//         <Route path="/" component={Homepage} exact />
//         <Route path="/coins/:id" component={CoinPage} exact />
        
//         {/* Install button */}
//         {showInstallButton && (
//           <button
//             className={classes.installButton}
//             onClick={handleInstallClick}
//           >
//             Install App
//           </button>
//         )}
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;



import { makeStyles } from "@material-ui/core";
import { useEffect, useState } from "react";
import Homepage from "./Pages/HomePage";
import "./App.css";
import { BrowserRouter, Route } from "react-router-dom";
import CoinPage from "./Pages/CoinPage";
import Header from "./components/Header";
import { 
  register,
  subscribeToPushNotifications,
  initializeBackgroundSync
} from "./serviceWorkerRegistration";
import { Button, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

const useStyles = makeStyles(() => ({
  App: {
    backgroundColor: "#14161a",
    color: "white",
    minHeight: "100vh",
  },
  installButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#61dafb",
    color: "#14161a",
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    zIndex: 1000,
    "&:hover": {
      backgroundColor: "#4fa8d3",
    },
  },
  syncButton: {
    position: "fixed",
    bottom: "80px",
    right: "20px",
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    zIndex: 1000,
    "&:hover": {
      backgroundColor: "#3e8e41",
    },
  },
  notificationButton: {
    position: "fixed",
    bottom: "140px",
    right: "20px",
    backgroundColor: "#9C27B0",
    color: "white",
    padding: "10px 20px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    zIndex: 1000,
    "&:hover": {
      backgroundColor: "#7B1FA2",
    },
  },
}));

function App() {
  const classes = useStyles();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);

  // Register service worker
  useEffect(() => {
    const registerSW = async () => {
      try {
        const registration = await register({
          onUpdate: (reg) => {
            setNotification({
              open: true,
              message: "New version available!",
              severity: "info"
            });
            if (window.confirm('New version available. Update now?')) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          },
          onSuccess: (reg) => {
            setServiceWorkerRegistration(reg);
            setNotification({
              open: true,
              message: "App is ready for offline use",
              severity: "success"
            });
          }
        });
      } catch (error) {
        console.error('Service worker registration failed:', error);
        setNotification({
          open: true,
          message: "Failed to register service worker",
          severity: "error"
        });
      }
    };

    registerSW();
  }, []);

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    const result = await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setNotification({
        open: true,
        message: "App installed successfully!",
        severity: "success"
      });
    } else {
      setNotification({
        open: true,
        message: "App installation declined",
        severity: "warning"
      });
    }
    
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const handleManualSync = async () => {
    if (!serviceWorkerRegistration) return;
    
    try {
      await initializeBackgroundSync(serviceWorkerRegistration);
      setNotification({
        open: true,
        message: "Background sync initiated",
        severity: "info"
      });
    } catch (err) {
      console.error('Manual sync failed:', err);
      setNotification({
        open: true,
        message: "Sync failed",
        severity: "error"
      });
    }
  };

  const handleEnableNotifications = async () => {
    if (!serviceWorkerRegistration) return;
    
    try {
      const subscription = await subscribeToPushNotifications(serviceWorkerRegistration);
      if (subscription) {
        setNotification({
          open: true,
          message: "Push notifications enabled",
          severity: "success"
        });
        // Here you would typically send the subscription to your backend
        console.log('Push subscription:', JSON.stringify(subscription));
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
      setNotification({
        open: true,
        message: "Failed to enable notifications",
        severity: "error"
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <BrowserRouter>
      <div className={classes.App}>
        <Header />
        <Route path="/" component={Homepage} exact />
        <Route path="/coins/:id" component={CoinPage} exact />
        
        {/* Install button */}
        {showInstallButton && (
          <button className={classes.installButton} onClick={handleInstallClick}>
            Install App
          </button>
        )}
        
        {/* Manual sync button */}
        <button className={classes.syncButton} onClick={handleManualSync}>
          Sync Data
        </button>
        
        {/* Enable notifications button */}
        <button className={classes.notificationButton} onClick={handleEnableNotifications}>
          Enable Notifications
        </button>
        
        {/* Notification snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
        >
          <Alert
            elevation={6}
            variant="filled"
            onClose={handleCloseNotification}
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </div>
    </BrowserRouter>
  );
}

export default App;