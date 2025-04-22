import React, { useState, useMemo } from 'react'; // Import useMemo
import { AutoComplete, Input } from 'antd';
import debounce from 'lodash.debounce'; // Import debounce

interface SearchBarProps {
	onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
	const [options, setOptions] = useState<{ value: string }[]>([]);
	const [suggestLoading, setSuggestLoading] = useState<boolean>(false); // Add loading state for suggestions

	// Refactored function to fetch suggestions
	const fetchSuggestions = async (query: string) => {
		if (!query) {
			setOptions([]);
			return; // Exit if query is empty
		}

		setSuggestLoading(true); // Start suggestions loading
		try {
			const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/suggestions?query=${encodeURIComponent(query)}`;
			const response = await fetch(apiUrl);
			const data = await response.json();

			// Check if suggestions are available and map them into the expected format
			if (data.suggestions && Array.isArray(data.suggestions)) {
				setOptions(data.suggestions.map((item: string) => ({ value: item })));
			} else {
				setOptions([]);
			}
		} catch (error) {
			console.error('Error fetching suggestions:', error);
			// No user message needed for suggestion errors, just clear options
			setOptions([]);
		} finally {
			setSuggestLoading(false); // Stop suggestions loading
		}
	};

	// Debounce the fetchSuggestions function
	const debouncedFetchSuggestions = useMemo(
		() => debounce(fetchSuggestions, 300), // 300ms delay
		[] // Empty dependency array means the debounced function is created once
	);

	// handleSuggestionSearch is no longer needed as onSearch directly uses the debounced function

	const handleSelect = (value: string) => {
		onSearch(value);
	};

	const handleSearchEnter = (value: string) => {
		onSearch(value);
	};

	return (
		<AutoComplete
			options={options}
			onSearch={debouncedFetchSuggestions} // Use the debounced function directly
			onSelect={handleSelect} // Trigger the search on select
			style={{ width: '100%' }}
		>
			<Input.Search
				placeholder="Search for papers..."
				allowClear
				onSearch={handleSearchEnter} // Handle Enter key press
				size="large"
				loading={suggestLoading} // Show loading indicator on the input
			/>
		</AutoComplete>
	);
};

export default SearchBar;
