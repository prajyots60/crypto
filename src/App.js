// import { makeStyles } from "@material-ui/core";
// import Homepage from "./Pages/HomePage";
// import "./App.css";
// import { BrowserRouter, Route } from "react-router-dom";
// import CoinPage from "./Pages/CoinPage";
// import Header from "./components/Header";

// const useStyles = makeStyles(() => ({
//   App: {
//     backgroundColor: "#14161a",
//     color: "white",
//     minHeight: "100vh",
//   },
// }));

// // Trigger PWA install prompt
// useEffect(() => {
//   window.addEventListener('beforeinstallprompt', (e) => {
//     e.preventDefault();
//     // Show a custom "Install App" button
//     const installButton = document.getElementById('install-button');
//     installButton.style.display = 'block';
//     installButton.onclick = () => e.prompt();
//   });
// }, []);

// function App() {
//   const classes = useStyles();

//   return (
//     <BrowserRouter>
//       <div className={classes.App}>
//         <Header />
//         <Route path="/" component={Homepage} exact />
//         <Route path="/coins/:id" component={CoinPage} exact />
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;




import { makeStyles } from "@material-ui/core";
import { useEffect, useState } from "react"; // Added useState
import Homepage from "./Pages/HomePage";
import "./App.css";
import { BrowserRouter, Route } from "react-router-dom";
import CoinPage from "./Pages/CoinPage";
import Header from "./components/Header";
import { register } from "./serviceWorkerRegistration"; // Added service worker registration

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
}));

function App() {
  const classes = useStyles();
  const [deferredPrompt, setDeferredPrompt] = useState(null); // State for install prompt
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Register service worker
  useEffect(() => {
    register({
      onUpdate: (registration) => {
        console.log('New version available!');
        if (window.confirm('New version available. Update now?')) {
          registration.waiting.postMessage({ action: 'SKIP_WAITING' });
          window.location.reload();
        }
      },
      onSuccess: (registration) => {
        console.log('Service worker registered successfully');
      }
    });
  }, []);

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      setShowInstallButton(false);
    });
  };

  return (
    <BrowserRouter>
      <div className={classes.App}>
        <Header />
        <Route path="/" component={Homepage} exact />
        <Route path="/coins/:id" component={CoinPage} exact />
        
        {/* Install button */}
        {showInstallButton && (
          <button
            className={classes.installButton}
            onClick={handleInstallClick}
          >
            Install App
          </button>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;