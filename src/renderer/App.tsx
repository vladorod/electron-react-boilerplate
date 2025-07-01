import './App.css';

// @ts-ignore
const webView = new WebView();


webView.addEventListener('did-start-loading', () => {
  // @ts-ignore
  webView.getWebContents().setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
});
export default function App() {

  return (
    <div className="app">
      <div className="custom-titlebar">
        <span className="logo">Punch</span>
        <div className="buttonsContainer">
          <div
            className="minimize"
            onClick={() => {
              // @ts-ignore
              electron.ipcRenderer.sendMessage('minimize_window');
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-minimize-2"
            >
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" x2="21" y1="10" y2="3" />
              <line x1="3" x2="10" y1="21" y2="14" />
            </svg>
          </div>
          <div
            className="minimize"
            onClick={() => {
              // @ts-ignore
              electron.ipcRenderer.sendMessage('fullScreen_window');
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-app-window-mac"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="M6 8h.01" />
              <path d="M10 8h.01" />
              <path d="M14 8h.01" />
            </svg>
          </div>
          <div
            className="close"
            onClick={() => {
              // @ts-ignore
              electron.ipcRenderer.sendMessage('close_window');
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-x"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </div>
        </div>
      </div>
      <webview
        style={{ display: 'flex', width: '100%', height: '96%' }}
        src="https://discord.boilerplateq.ru/"
        webpreferences="allowRunningInsecureContent, javascript=yes"
      ></webview>
    </div>
  );
}
