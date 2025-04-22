import React, { useState } from 'react';
import { Layout, Typography, message } from 'antd'; // Import message
import SearchBar from './components/SearchBar';
import ResultsList from './components/ResultsList';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
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
				} catch (jsonError) {
					// Ignore if response is not JSON, jsonError is intentionally unused here
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
					backgroundColor: '#001529',
					color: '#fff',
					padding: '0 50px',
					textAlign: 'center', // Center content inside header
				}}
			>
				<Typography.Title level={3} style={{ color: '#fff' }}>
					Semantic Search App
				</Typography.Title>
			</Header>
			<Content
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center', // Centers the content horizontally
					padding: '16px 50px',
					maxWidth: '100%',
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
				Semantic Search App ©2025 Created by TwoSetAI
			</Footer>
		</Layout>
	);
};

export default App;
