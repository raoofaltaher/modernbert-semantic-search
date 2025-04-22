import React from 'react';
import { Card, List, Typography, Spin } from 'antd'; // Import Spin

interface ResultsListProps {
	results: { title: string; score: number; abstract: string }[]; // Add abstract to results type
	loading: boolean; // Add loading prop
}

const ResultsList: React.FC<ResultsListProps> = ({ results, loading }) => { // Destructure loading prop
	return (
		<Spin spinning={loading} tip="Searching..." style={{ width: '100%', marginTop: '20px' }}>
			<List
				dataSource={results}
				renderItem={(item) => (
				<List.Item>
					<Card
						bordered={false}
						hoverable
						style={{
							width: '100%',
							boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', // Refined shadow
							marginBottom: '16px', // Spacing between cards
							// backgroundColor: '#ffffff', // Use theme default or customize if needed
							borderRadius: '8px', // Slightly more rounded, or use theme token
							transition: 'box-shadow 0.3s ease, transform 0.3s ease', // Add transition
						}}
					>
						<div style={{ padding: '12px 24px' }}> {/* Add some internal padding */}
							<Typography.Title level={5} style={{ fontWeight: 'bold' }}>
								{item.title}
							</Typography.Title>
							<Typography.Paragraph>
								Relevance Score: {parseFloat(item.score.toFixed(4))}
							</Typography.Paragraph>
							{/* Display abstract with ellipsis */}
							<Typography.Paragraph ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}>
								{item.abstract}
							</Typography.Paragraph>
						</div>
					</Card>
				</List.Item>
			)}
			style={{ marginTop: '16px' }}
		/>
		</Spin> // Add missing closing Spin tag
	);
};

export default ResultsList;
