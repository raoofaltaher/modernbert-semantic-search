# ModernBERT Semantic Search - Frontend Improvement Plan

This document outlines the step-by-step plan to implement improvements to the frontend, aiming for a more interactive, modern, and AI-inspired look and feel.

---

## Phase 1: Theme, Layout, and Core Styling

### 1. Theme Customization (Ant Design)

*   **Goal:** Establish a modern base theme (light/dark) using Ant Design's built-in capabilities.
*   **Steps:**
    1.  **Modify `frontend/src/main.tsx`:**
        *   Import `ConfigProvider` and `theme` from `antd`.
        *   Wrap the `<App />` component with `<ConfigProvider>`.
        *   Configure the theme. We'll start with a slightly customized default algorithm and potentially add a dark theme later.
        ```typescript
        import React from 'react';
        import ReactDOM from 'react-dom/client';
        import App from './App.tsx';
        import './index.css';
        import { ConfigProvider, theme } from 'antd'; // Import ConfigProvider & theme

        ReactDOM.createRoot(document.getElementById('root')!).render(
          <React.StrictMode>
            <ConfigProvider
              theme={{
                // Example: Use the dark algorithm
                // algorithm: theme.darkAlgorithm,
                // Example: Customize primary color
                token: {
                  colorPrimary: '#1677ff', // Or another modern color
                  // Add other token customizations (borderRadius, etc.)
                },
              }}
            >
              <App />
            </ConfigProvider>
          </React.StrictMode>
        );
        ```
    2.  **Refine Theme Tokens:** Experiment with `token` values in `ConfigProvider` (e.g., `borderRadius`, `colorBgLayout`, `colorText`) to achieve the desired modern aesthetic.

### 2. Layout Refinement (`frontend/src/App.tsx`)

*   **Goal:** Improve spacing, alignment, and overall structure.
*   **Steps:**
    1.  **Adjust Padding/Margins:** Modify the `style` props on `Layout`, `Header`, `Content`, `Footer` for better visual balance. Use Ant Design's standard spacing values where possible.
        *   Example: Increase top/bottom padding in `Content`.
        ```typescript
        // In App.tsx -> Content style
        padding: '24px 50px', // Increased vertical padding
        ```
    2.  **Constrain Content Width:** Limit the maximum width of the main content area (`Content`) for better readability on wider screens, while keeping it centered.
        ```typescript
        // In App.tsx -> Content style
        maxWidth: '1200px', // Example max width
        width: '100%', // Ensure it takes full width up to max
        margin: '0 auto', // Center the content block itself
        // Keep alignItems: 'center' to center items *within* the content block
        ```
    3.  **Header Styling:** Add subtle styling to the header, maybe a border or shadow.
        ```typescript
        // In App.tsx -> Header style
        borderBottom: '1px solid #f0f0f0', // Example subtle border (adjust color for theme)
        ```

### 3. Global Styles & Fonts (`frontend/src/index.css`)

*   **Goal:** Set a modern base font and potentially a subtle background gradient.
*   **Steps:**
    1.  **Import Font:** Choose a clean, modern font (e.g., from Google Fonts like 'Inter', 'Poppins'). Add the `@import` rule to the top of `index.css`.
        ```css
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');

        body {
          margin: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          /* Optional: Subtle background gradient */
          /* background: linear-gradient(to bottom, #f8f9fa, #e9ecef); */
          /* Adjust colors based on theme */
          min-height: 100vh;
        }
        /* Other global resets or base styles */
        ```
    2.  **Apply Font:** Ensure the `font-family` is set on the `body` or a high-level element. Ant Design components should inherit this, but verify.

---

## Phase 2: Enhancing Search Bar & Suggestions

### 4. Search Bar Styling (`frontend/src/components/SearchBar.tsx` & CSS)

*   **Goal:** Make the search bar more prominent and visually appealing.
*   **Steps:**
    1.  **Increase Size/Padding:** Use `antd` props (`size="large"`) - already done.
    2.  **Add Subtle Effects:** Consider adding a slight box-shadow or border on focus using CSS targeting the `antd` classes (inspect element to find the correct classes like `.ant-input-search`). Create a corresponding CSS module (`SearchBar.module.css`) or use styled-components if preferred.
        ```css
        /* Example in SearchBar.module.css or App.css */
        .ant-input-search-focused {
          box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.2); /* Example focus ring */
          border-color: #1677ff;
        }
        ```
    3.  **Style AutoComplete Dropdown:** Customize the appearance of the suggestion dropdown using CSS targeting `.ant-select-dropdown`.

### 5. Suggestion Interaction (`frontend/src/components/SearchBar.tsx`)

*   **Goal:** Improve how suggestions are presented and interacted with.
*   **Steps:**
    1.  **Highlight Match:** Potentially highlight the part of the suggestion that matches the user's input query. This requires more complex logic within the `fetchSuggestions` or mapping logic, possibly using a library or custom function to wrap matched text in `<strong>` tags.
    2.  **Clearer Options:** Ensure the dropdown is styled clearly (handled partly by theme customization).

---

## Phase 3: Revamping Results Display

### 6. Result Card Styling (`frontend/src/components/ResultsList.tsx` & CSS)

*   **Goal:** Modernize the appearance of individual result cards.
*   **Steps:**
    1.  **Refine Card Style:** Adjust padding, background color (subtly different from page background), border-radius (via theme `token`), and hover effects.
        ```typescript
        // In ResultsList.tsx -> Card style prop
        style={{
          width: '100%',
          // boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)', // Refined shadow
          marginBottom: '16px',
          // backgroundColor: '#ffffff', // Adjust based on theme
          // borderRadius: '8px', // Or set via theme token
          transition: 'box-shadow 0.3s ease, transform 0.3s ease', // Add transition
        }}
        // Add CSS for hover effect:
        // .ant-card-hoverable:hover {
        //   transform: translateY(-3px);
        //   box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
        // }
        ```
    2.  **Typography:** Ensure consistent and readable typography within the card using `antd` `Typography` components. Adjust font sizes or weights if needed.
    3.  **Score Visualization:** Instead of just text "Relevance: X", consider a more visual representation like a small progress bar/ring or color-coding based on score (requires careful design not to be distracting).
        *   *Initial Step:* Keep text but improve formatting/label.

### 7. Result List Animation (`frontend/src/components/ResultsList.tsx`)

*   **Goal:** Add subtle animations when results appear/update.
*   **Steps:**
    1.  **Use Animation Library:** Integrate a library like `Framer Motion` or use CSS transitions/animations.
    2.  **Wrap List Items:** Wrap the `List.Item` or `Card` in an animated component (e.g., `motion.div` from Framer Motion) and define entry/exit animations (e.g., fade in, slide up slightly).
        *   *Note:* This adds complexity and a new dependency. Start simple with CSS transitions on hover/focus first.

---

## Phase 4: Interactivity & Polish

### 8. Dark Mode Toggle

*   **Goal:** Allow users to switch between light and dark themes.
*   **Steps:**
    1.  **State Management:** Add state in `App.tsx` to track the current theme mode (`'light' | 'dark'`).
    2.  **Theme Algorithm:** Conditionally apply `theme.darkAlgorithm` or `theme.defaultAlgorithm` in `main.tsx`'s `ConfigProvider` based on the state.
    3.  **Toggle Component:** Create a simple switch/button component (e.g., in the `Header`) that updates the theme state.
    4.  **Persistence:** Optionally save the user's preference to `localStorage`.

### 9. Responsiveness

*   **Goal:** Ensure the layout adapts well to different screen sizes.
*   **Steps:**
    1.  **Test:** Use browser developer tools to check layout on various device sizes (mobile, tablet, desktop).
    2.  **Adjust Styles:** Use CSS media queries or `antd`'s responsive grid system (`Row`, `Col`) if necessary to adjust padding, font sizes, or component layouts for smaller screens. Ensure the `Content`'s `maxWidth` doesn't cause issues on small screens.

---
