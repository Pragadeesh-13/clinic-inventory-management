# Clinic Inventory Management System

A comprehensive web-based inventory management system designed specifically for clinics and healthcare facilities. Built with modern HTML5, CSS3, and vanilla JavaScript, this system provides real-time tracking of medical supplies, medicines, and equipment with advanced alerting capabilities.

## 🌟 Features

### Core Functionality
- **Real-time Inventory Tracking** - Monitor stock levels of medical items in real-time
- **Smart Alerts** - Visual and browser notifications for low stock and expiring items
- **Advanced Search & Filtering** - Find items by name, category, expiry status, and more
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Offline Capability** - Continue working even without internet connection

### Inventory Management
- **Add/Edit/Delete Items** - Complete CRUD operations for inventory items
- **Batch Management** - Track items by batch numbers
- **Category Organization** - Organize items by Medicine, Consumable, Equipment, Supplement
- **Quick Stock Adjustments** - Increase/decrease quantities with one click
- **Expiry Date Tracking** - Monitor expiration dates with automated alerts

### Dashboard & Analytics
- **Visual Statistics** - Overview of total items, low stock alerts, and expiring items
- **Recent Activity** - Track all inventory changes and updates
- **Critical Alerts Preview** - Immediate visibility of urgent issues
- **Auto-refresh** - Configurable automatic data refresh

### Alert System
- **Multi-level Alerts** - Critical, warning, and info level notifications
- **Customizable Thresholds** - Set low stock thresholds per item
- **Expiry Warnings** - Configurable advance warning for expiring items (default 30 days)
- **Visual Indicators** - Color-coded status badges and icons
- **Dismissible Alerts** - Mark alerts as read or dismiss them

### User Experience
- **Clean UI Design** - Modern, intuitive interface with professional styling
- **Keyboard Shortcuts** - Power user features for quick navigation
- **Form Validation** - Real-time validation with helpful error messages
- **Toast Notifications** - Non-intrusive success and error messages
- **Modal Dialogs** - Focused editing experience without page reloads

## 🚀 Quick Start

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Web server (for development: Python SimpleHTTPServer, Node.js http-server, or similar)
- No additional dependencies required - pure HTML/CSS/JavaScript

### Installation

1. **Clone or Download**
   ```bash
   git clone <repository-url>
   cd clinic-inventory-management
   ```

2. **Start Local Server**
   
   Using Python 3:
   ```bash
   python -m http.server 8000
   ```
   
   Using Python 2:
   ```bash
   python -m SimpleHTTPServer 8000
   ```
   
   Using Node.js:
   ```bash
   npx http-server -p 8000
   ```

3. **Open in Browser**
   ```
   http://localhost:8000
   ```

### File Structure
```
clinic-inventory-management/
├── index.html              # Main application file
├── styles/                 # CSS files
│   ├── main.css           # Core styles and variables
│   ├── components.css     # Component-specific styles
│   └── responsive.css     # Responsive design rules
├── js/                    # JavaScript modules
│   ├── main.js           # Application initialization
│   ├── data.js           # Data management and mock data
│   ├── api.js            # API layer for backend communication
│   ├── ui.js             # UI management and interactions
│   ├── inventory.js      # Inventory-specific operations
│   ├── dashboard.js      # Dashboard functionality
│   ├── alerts.js         # Alert system management
│   └── utils.js          # Utility functions
└── README.md             # This file
```

## 🛠️ Configuration

### Mock Data
The system comes with sample data for demonstration. Modify the `getInitialData()` function in `js/data.js` to customize the initial inventory items.

### Alert Thresholds
- **Low Stock Threshold**: Default is 10 units (configurable per item)
- **Expiry Warning**: Default is 30 days (configurable globally)

### Auto-refresh Settings
- **Default Interval**: 30 seconds
- **User Configurable**: Can be changed in dashboard settings

## 🔌 Backend Integration

The system is designed to work with MongoDB via Claude MCP. The API layer (`js/api.js`) simulates backend calls but can be easily modified for real backend integration.

### API Endpoints (for backend implementation)
```javascript
GET    /api/inventory        # Get all items
POST   /api/inventory        # Create new item
GET    /api/inventory/:id    # Get specific item
PUT    /api/inventory/:id    # Update item
DELETE /api/inventory/:id    # Delete item
GET    /api/analytics        # Get dashboard analytics
GET    /api/alerts           # Get all alerts
```

### Sample API Response Format
```json
{
  "success": true,
  "data": {
    "id": "unique-id",
    "name": "Item Name",
    "category": "Medicine",
    "quantity": 50,
    "lowStockThreshold": 10,
    "expiryDate": "2025-12-31",
    "batchNumber": "BATCH001",
    "description": "Item description",
    "dateAdded": "2024-01-01",
    "lastUpdated": "2024-08-07"
  }
}
```

## 📱 Usage Guide

### Dashboard
- View overall statistics and recent activity
- Monitor critical alerts that need immediate attention
- Access quick actions to other sections

### Inventory Management
1. **View Items**: Browse all inventory items in a sortable table
2. **Search**: Use the search bar to find specific items
3. **Filter**: Filter by category or status (in-stock, low-stock, expired)
4. **Quick Actions**: Use +/- buttons for quick quantity adjustments
5. **Edit Items**: Click the edit button or item row to modify details

### Adding New Items
1. Navigate to "Add Item" section
2. Fill in required fields:
   - Item Name (required)
   - Category (required)
   - Quantity (required)
   - Expiry Date (required)
   - Optional: Low Stock Threshold, Batch Number, Description
3. Click "Add Item" to save

### Alerts
- **Low Stock**: Items below their threshold
- **Expiring Soon**: Items nearing expiration (within 30 days)
- **Expired**: Items past their expiry date
- **Out of Stock**: Items with zero quantity

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus search bar
- `Alt + 1`: Dashboard
- `Alt + 2`: Inventory
- `Alt + 3`: Add Item
- `Alt + 4`: Alerts
- `Escape`: Close modal
- `Ctrl/Cmd + /`: Show keyboard shortcuts

## 🎨 Customization

### Themes
The system supports custom themes. Modify CSS variables in `styles/main.css`:

```css
:root {
  --primary-color: #2563eb;    /* Main brand color */
  --success-color: #10b981;    /* Success indicators */
  --warning-color: #f59e0b;    /* Warning indicators */
  --danger-color: #ef4444;     /* Error/critical indicators */
}
```

### Categories
Add or modify categories in the `categories` array in `js/data.js`:

```javascript
this.categories = ['Medicine', 'Consumable', 'Equipment', 'Supplement'];
```

### Low Stock Thresholds
Set global default or per-item thresholds:

```javascript
this.lowStockThreshold = 10; // Global default
```

## 🔧 Development

### Adding New Features
1. Create new functions in appropriate modules
2. Add UI components in HTML
3. Style components in CSS
4. Initialize in main application

### Code Structure
- **Modular Design**: Each major feature is in its own module
- **Event-Driven**: Uses custom events for module communication
- **Responsive**: Mobile-first design approach
- **Accessible**: ARIA labels and keyboard navigation support

### Browser Support
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🐛 Troubleshooting

### Common Issues

**Data Not Persisting**
- Check if localStorage is available in your browser
- Clear browser cache and reload

**UI Not Responsive**
- Ensure viewport meta tag is present
- Check browser zoom level

**Alerts Not Showing**
- Verify notification permissions in browser
- Check if dates are in correct format

**Performance Issues**
- Large datasets may slow the interface
- Consider implementing pagination for 1000+ items

## 📋 Data Format

### Item Structure
```javascript
{
  id: "unique-identifier",
  name: "Item Name",
  category: "Medicine|Consumable|Equipment|Supplement",
  quantity: 50,
  lowStockThreshold: 10,
  expiryDate: "YYYY-MM-DD",
  batchNumber: "Optional batch number",
  description: "Optional description",
  dateAdded: "YYYY-MM-DD",
  lastUpdated: "YYYY-MM-DD"
}
```

## 🚦 Status Indicators

- **🟢 In Stock**: Adequate quantity available
- **🟡 Low Stock**: Below threshold but not empty
- **🔴 Out of Stock**: Zero quantity
- **🟠 Expiring Soon**: Within warning period
- **⚫ Expired**: Past expiry date

## 📊 Analytics

The system tracks:
- Total inventory items
- Low stock alerts count
- Items expiring soon
- Items already expired
- Recent activity log
- User interactions (local only)

## 🔐 Security Considerations

- All data stored locally in browser
- No external API calls in demo mode
- Input sanitization for XSS prevention
- Form validation on client and server (when integrated)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description

## 📞 Support

For issues and questions:
- Check troubleshooting section
- Review browser console for errors
- Ensure all files are properly served from web server

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for healthcare professionals**

*Clinic Inventory Management System - Keeping healthcare supplies organized and accessible.*
