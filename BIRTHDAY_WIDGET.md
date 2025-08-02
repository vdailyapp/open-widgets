# Birthday Widget Documentation

## Overview
The Birthday Widget is a beautiful, customizable widget designed to celebrate birthdays with style. It features animated confetti, customizable themes, and a user-friendly settings interface.

## Features

### 🎨 Customization Options
- **Person's Name**: Personalize the birthday message
- **Birthday Message**: Custom message text (default: "Happy Birthday!")
- **Themes**: 6 beautiful gradient themes
  - Sunset (Pink → Purple → Indigo)
  - Ocean (Blue → Cyan → Teal)
  - Forest (Green → Emerald → Cyan)
  - Sunset Orange (Orange → Red → Pink)
  - Royal (Purple → Blue → Indigo)
  - Pastel (Light Pink → Light Purple → Light Indigo)
- **Font Styles**: Serif, Sans Serif, Mono
- **Animations**: Bounce, Pulse, Ping, or None
- **Confetti**: Toggle animated confetti particles

### 🖥️ Technical Features
- **Responsive Design**: Works on all screen sizes
- **localStorage Persistence**: Settings are saved between sessions
- **postMessage API**: Perfect for iframe embedding
- **Floating Settings Button**: Easy access to customization
- **Real-time Updates**: Changes apply immediately

## Usage

### Direct Access
Visit `/birthday` to use the widget directly.

### Iframe Embedding
```html
<iframe 
  src="http://localhost:4321/birthday" 
  width="800" 
  height="600"
  frameborder="0">
</iframe>
```

### PostMessage API
Control the widget from a parent window:

```javascript
// Send configuration to widget
iframe.contentWindow.postMessage({
  type: 'BIRTHDAY_CONFIG_UPDATE',
  config: {
    personName: 'John',
    message: 'Happy Birthday!',
    theme: {
      background: 'from-blue-400 via-cyan-400 to-teal-400',
      primary: 'text-white',
      secondary: 'text-yellow-300',
      text: 'text-white'
    },
    font: 'font-sans',
    animation: 'animate-pulse',
    showConfetti: true
  }
}, '*');
```

### Configuration Object
```typescript
interface BirthdayConfig {
  personName: string;           // Name of birthday person
  message: string;              // Birthday message
  theme: {
    background: string;         // Tailwind gradient classes
    primary: string;           // Primary text color
    secondary: string;         // Secondary text color  
    text: string;             // General text color
  };
  font: string;               // Font family class
  animation: string;          // Animation class
  showConfetti: boolean;      // Enable/disable confetti
}
```

## Examples

### Basic Usage
The widget loads with sensible defaults and can be customized via the settings button.

### Iframe Integration
Perfect for embedding in websites, blogs, or applications where you want to add birthday celebrations.

### API Control
Use the postMessage API to create dynamic birthday experiences controlled by parent applications.

## Browser Compatibility
- Modern browsers supporting CSS Grid and Flexbox
- JavaScript ES6+ features
- localStorage support