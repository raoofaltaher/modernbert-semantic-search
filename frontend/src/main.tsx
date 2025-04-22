import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme } from 'antd'; // Re-import theme
import App from './App.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext'; // Import ThemeProvider and useTheme
import './index.css'; // Re-enable index.css import

// Create a wrapper component to access the theme context
const AppWrapper: React.FC = () => {
  const { themeMode } = useTheme(); // Get themeMode from context

  return (
    <ConfigProvider
      theme={{
        // Apply algorithm based on themeMode
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        // Keep existing token customizations
        token: {
          colorPrimary: '#0057D9', // A slightly different blue
          borderRadius: 6, // Example border radius
          // Add other token customizations here if desired
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
};

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<ThemeProvider> {/* Wrap with ThemeProvider */}
			<AppWrapper /> {/* Render the wrapper */}
		</ThemeProvider>
	</StrictMode>
);
