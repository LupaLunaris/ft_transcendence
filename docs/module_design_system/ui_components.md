# Module Custom-made design system
For the Minor Web Module: Custom-made design system with reusable components, including a proper
color palette, typography, and icons (minimum: 10 reusable components).

## Color palette

We defined a custom color palette in the Tailwind configuration.
Colors are organized with different shades to keep visual consistency across the pages.
For example, the silver color contains multiple shades:

        silver: {
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
        },

## Typography

Same as color palette, we defined the fonts used throughout the project directly in the Tailwind configuration.
The application uses different font families depending on the context:

      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        fantasy: ["Cinzel", "Georgia", "serif"],
      },

## Icons

We use a combination of emojis and the Lucide icon library depending on the use case.
The icon style is kept consistent across the application, especially for interactive components such as the TouchPad.

## List of the 10 reusable components

These components are shared across different pages to avoid duplicated UI logic and maintain a consistent design throughout the application.

1. Button
    - Used in many pages and other components for user actions:
        - GameOverModal, Navbar, CongratulatoryModal
        - LoginPage, RegisterPage, DuelGamePage, DuelPage, ...
    - The component handles:
        - Different visual variants (primary, secondary, danger and ghost)
        - Different sizes (sm, md and lg)
        - Disabled state
        - Loading state with Spinner

2. Input
    - Used in pages and components where users need to enter information:
        - ProfileEditor, Login and Register pages, EditorPage
    - The component handles:
        - Optional labels linked to the input
        - Error messages and error styling
        - Disabled state
        - Custom input attributes through HTML input props

3. Avatar
    - Used in pages and components where a user's profile picture or identity is displayed:
        - FriendsList, UserSearch, Navbar, PlayerHub, Leaderboard, ProfileEditor
        - DuelGamePage, GamePage, ProfilePage
    - The component handles:
        - Displaying the user's avatar image
        - Providing a default avatar when no image is available
        - Using the username as the image alternative text
 
4. Spinner
    - Used when loading can occur:
        - FriendsList, Leaderboard, Button
        - LoginPage, DuelGamePage, EditorPage, ...
    - The component handles:
        - Different sizes (sm, md and lg)
        - Animated loading state
        - Accessible loading indicator with aria-label and role attributes
        - Custom styling through className depending on where it is used

5. Layout
    - Used as the main structure for every page, excluding GamePage, DuelGamePage, TowerGamePage and the authetication pages:
        - includes Navbar, Footer and PlayerHub depending on the current route
    - The component handles:
        - Global application layout
        - Navbar and Footer rendering
        - Conditional PlayerHub display depending on authentication and current route

6. Footer
    - Used as a global component displayed at the bottom of the pages through the layout component
    - The component handles:
        - Copyright information
        - Terms and privacy information

7. Navbar
    - Used as a global navigation component displayed through the Layout component:
    - The component handles:
        - Navigation links between application pages
        - User avatar and profile access
        - Login, register and logout actions
        - Language selection
        - Responsive layout
        
8. TouchPad
    - Used in:
        - GameCanvas
        - DuelGamePage (because this page doesn't use GameCanvas)
    - The component handles:
        - Four directional controls (up, down, left and right)
        - Pointer press and release events
        - Displaying touch controls only on devices with coarse pointers

9. GameOverModal
    - used in game pages when the player loses the game: 
        - GamePage and TowerGamePage
    While the CongratulatoryModal is only used in the TowerGamePage
    - The component handles: 
        - Displaying the game over message
        - Restart action through a reusable Button component
        - Returning to the previous page through a customizable back action

10. Toast notification systemx
    - Used in pages where temporary user feedback messages need to be displayed:
        - LoginPage, RegisterPage, DuelGamePage, EditorPage, GamePage
    - The component handles:
        - Displaying multiple toast notifications
        - Different notification types (success, error and info)
        - Dismissing notifications
        - Consistent toast styling and positioning across the application
        - Accessibility with alert role and live region

11. Other components
    - CongratulatoryModal
    - LanguageSelector
        - Used in Navbar. Handles language switching, displays the current language and allows a dropdown menu interaction
    - Modal
        - Used multiple times in EditorPage
    - Other components used to handle specific needs across the pages

