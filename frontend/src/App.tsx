import React, { useState } from 'react';
import { Layout, Typography, message, Switch } from 'antd'; // Import Switch
import { SunOutlined, MoonOutlined } from '@ant-design/icons'; // Import icons
import { useTheme } from './context/ThemeContext'; // Import useTheme hook
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
	const { themeMode, toggleTheme } = useTheme(); // Use theme context
	// Update state type to include abstract
	const [results, setResults] = useState<{ title: string; score: number; abstract: string }[]>([]);
	const [loading, setLoading] = useState<boolean>(false); // Add loading state

	const handleSearch = async (query: string) => {
		if (!query) { // Clear results if query is empty
			setResults([]);
			return;
		}
		setLoading(true); // Start loading
		try {
			const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/search?query=${encodeURIComponent(query)}`;
			const response = await fetch(apiUrl);
			// Basic check for response status
			if (!response.ok) {
				// Try to get error detail from backend if available
				let errorDetail = `HTTP error! status: ${response.status}`;
				try {
					const errorData = await response.json();
					errorDetail = errorData.detail || errorDetail;
				} catch (jsonError /* eslint-disable-line @typescript-eslint/no-unused-vars */) {
					// Ignore if response is not JSON, explicitly marking jsonError as unused for linters
				}
				throw new Error(errorDetail);
			}
			const data = await response.json();
			setResults(data.results);
		} catch (error) {
			console.error('Error fetching search results:', error);
			message.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
			setResults([]); // Clear previous results on error
		} finally {
			setLoading(false); // Stop loading regardless of success/error
		}
	};

	return (
		<Layout
			style={{
				minHeight: '100vh',
				width: '100%',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'space-between', // Ensures full height is used
			}}
		>
			<Header
				style={{
					backgroundColor: '#001529', // Consider using theme token if available/needed
					color: '#fff',
					padding: '0 50px',
					textAlign: 'center',
					borderBottom: '1px solid #003a8c', // Darker border for dark header
					// Optional: Add a subtle shadow
					// boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
					display: 'flex', // Use flexbox for alignment
					justifyContent: 'space-between', // Space title and switch
					alignItems: 'center', // Vertically align items
				}}
			>
				<Typography.Title level={3} style={{ color: '#fff', margin: 0 /* Remove default margin */ }}>
					Semantic Search App
				</Typography.Title>
				<Switch
					checkedChildren={<SunOutlined />}
					unCheckedChildren={<MoonOutlined />}
					checked={themeMode === 'light'}
					onChange={toggleTheme}
				/>
			</Header>
			<Content
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center', // Centers items *within* the content block
					padding: '24px 50px', // Increased vertical padding
					width: '100%', // Ensure it takes full width up to max
					maxWidth: '1200px', // Constrain max width
					margin: '0 auto', // Center the content block itself
				}}
			>
				<SearchBar onSearch={handleSearch} />
				{/* Ensure ResultsList props match the state type & pass loading prop */}
				<ResultsList results={results} loading={loading} />
			</Content>
			<Footer
				style={{
					textAlign: 'center',
					width: '100%',
				}}
			>
				Semantic Search App ©2025
			</Footer>
		</Layout>
	);
};

export default App;
