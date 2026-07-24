# Super Admin Dashboard Documentation

## Overview

The Super Admin Dashboard provides comprehensive system administration capabilities for the Egypt AI Flow CRM platform. It allows super administrators to have full visibility, control, and management over the entire system including users, organizations, subscriptions, roles, permissions, and analytics.

## Features

### 1. Access & Authentication
- **Role-based Access**: Only users with `super_admin` role can access the dashboard
- **Supabase Integration**: Full integration with existing authentication and RLS policies
- **Session Management**: Auto-logout after inactivity and session tracking
- **Security**: IP address logging and user agent tracking for all activities

### 2. Dashboard Overview (Home)
- **KPI Cards**: 
  - Total Users with growth percentage
  - Active Organizations with growth metrics
  - Active Subscriptions count
  - Monthly Revenue with trend analysis
  - Pending Approvals requiring attention
- **Quick Actions**: Direct access to major modules
- **Real-time Notifications**: New signups, payments, errors, pending tasks
- **Recent Activity**: Latest system events and user actions

### 3. Users Management
- **User Listing**: View all users with comprehensive filtering
- **Search Functionality**: Search by name, email, or ID
- **User Operations**:
  - Edit user information
  - Assign/modify roles
  - Reset passwords
  - Suspend or activate users
- **Export Capabilities**: CSV export of user data
- **Filters**: By role, status, organization

### 4. Organizations Management
- **Organization Overview**: View all organizations with subscription info
- **Status Management**: Approve, reject, or suspend organizations
- **Member Management**: View and manage organization members and roles
- **Subscription Control**: Upgrade/downgrade subscriptions
- **Detailed View**: Organization details, members, and subscription information
- **Export**: Organization data export functionality

### 5. Roles & Permissions
- **Role Management**: Create, edit, and delete user roles
- **Permission Templates**: Predefined permission sets for common roles
- **Granular Permissions**: Fine-grained control over system features
- **User Assignment**: Assign roles to users across organizations
- **Permission Categories**:
  - Organization management
  - User management
  - Team management
  - Reports and analytics
  - Project management
  - Sales operations
  - Account management

### 6. Subscriptions & Payments
- **Subscription Overview**: View all subscription plans and users
- **Payment Tracking**: Monitor payment history and status
- **Revenue Analytics**: Track revenue trends and growth
- **Manual Adjustments**: Process refunds and manual billing adjustments
- **Payment Integration**: Support for Paymob and other payment methods
- **Subscription Tiers**: Manage pricing and features for different plans

### 7. Reports & Analytics
- **Revenue Trends**: Monthly/quarterly/yearly revenue analysis
- **User Growth**: Active vs inactive user metrics
- **Subscription Distribution**: Revenue by subscription tier
- **Payment Analytics**: Success/failure rates and trends
- **Exportable Reports**: PDF/Excel export capabilities
- **Interactive Charts**: Responsive charts using Recharts library

### 8. System Settings
- **General Settings**: Site configuration and branding
- **Payment Configuration**: Currency, methods, and billing settings
- **Notification Settings**: Email, SMS, and push notification controls
- **Security Policies**: Session timeout, password requirements, 2FA
- **Feature Toggles**: Enable/disable system features per organization
- **System Announcements**: Create and manage system-wide announcements

### 9. Audit Logs
- **Comprehensive Logging**: Track all critical admin actions
- **Advanced Filtering**: Filter by user, action, date range, status
- **Search Functionality**: Search across all log fields
- **Export Capabilities**: Export filtered logs to CSV
- **Real-time Tracking**: Live activity monitoring
- **Detailed Information**: IP addresses, user agents, and action details

## Technical Implementation

### Architecture
- **React + TypeScript**: Type-safe component development
- **React Router v6**: Nested routing for dashboard sections
- **Supabase Integration**: Database, authentication, and real-time features
- **Tailwind CSS**: Consistent styling with existing CRM design
- **Headless UI**: Accessible component primitives
- **Recharts**: Interactive data visualization

### Database Schema
```sql
-- Audit logging
audit_logs (id, user_id, action, resource_type, details, timestamp, ...)

-- System configuration
system_settings (category, key, value, updated_by, ...)

-- Global announcements
system_announcements (title, message, type, active, ...)

-- Session management
user_sessions (user_id, session_token, expires_at, ...)
```

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Role-based Access**: Super admin role verification
- **Audit Trail**: Complete activity logging
- **Session Management**: Secure session handling
- **IP Tracking**: Security monitoring

### Performance Optimizations
- **Database Indexing**: Optimized queries for large datasets
- **Pagination**: Efficient data loading for large tables
- **Caching**: Strategic caching for frequently accessed data
- **Lazy Loading**: Component-level code splitting

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase project with existing CRM schema
- Super admin user role configured

### Installation Steps

1. **Install Dependencies**
```bash
npm install @headlessui/react @heroicons/react
npm install @radix-ui/react-checkbox @radix-ui/react-switch @radix-ui/react-popover
npm install recharts date-fns react-day-picker
```

2. **Run Database Migration**
```bash
supabase migration up
```

3. **Configure Super Admin Role**
```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('your-user-id', 'super_admin');
```

4. **Update Environment Variables**
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Routing Configuration
The Super Admin Dashboard uses nested routing:
```
/super-admin
├── / (Dashboard Overview)
├── /users (Users Management)
├── /organizations (Organizations Management)
├── /roles (Roles & Permissions)
├── /subscriptions (Subscriptions & Payments)
├── /reports (Reports & Analytics)
├── /settings (System Settings)
└── /audit (Audit Logs)
```

## Usage Guide

### Accessing the Dashboard
1. Login with a super admin account
2. Navigate to `/super-admin`
3. Use the sidebar to access different modules

### Managing Users
1. Go to Users Management
2. Use filters to find specific users
3. Click "Edit" to modify user details
4. Use action buttons to suspend/activate users

### Approving Organizations
1. Navigate to Organizations Management
2. Click "View" on pending organizations
3. Review organization details and members
4. Use "Approve", "Reject", or "Suspend" buttons

### Configuring System Settings
1. Access System Settings
2. Use tabs to navigate different categories
3. Modify settings as needed
4. Click "Save" to apply changes

### Monitoring Activity
1. Check Audit Logs for detailed activity
2. Use filters to find specific events
3. Export logs for external analysis
4. Monitor real-time notifications

## API Integration

### Supabase Functions
- `get_system_stats()`: Retrieve dashboard statistics
- `log_audit_event()`: Log system activities
- `update_system_setting()`: Modify system configuration
- `cleanup_expired_sessions()`: Session maintenance

### Real-time Features
- Live notifications for system events
- Real-time user activity monitoring
- Instant updates for organization approvals
- Live payment processing status

## Internationalization (i18n)

The dashboard supports multiple languages:
- **English**: Default language
- **Arabic**: RTL support for Arabic users
- **Extensible**: Easy to add more languages

### Adding New Languages
1. Create translation files in `src/i18n/locales/`
2. Update language selector component
3. Test RTL layout for Arabic-like languages

## Security Considerations

### Access Control
- Super admin role verification at route level
- Database RLS policies for data protection
- Session-based authentication with timeout

### Data Protection
- Sensitive data masking in logs
- Encrypted storage for configuration
- Audit trail for all administrative actions

### Monitoring
- Failed login attempt tracking
- Suspicious activity detection
- Real-time security alerts

## Troubleshooting

### Common Issues

1. **Access Denied Error**
   - Verify super admin role assignment
   - Check RLS policies in database
   - Ensure user is properly authenticated

2. **Data Not Loading**
   - Check Supabase connection
   - Verify database permissions
   - Review browser console for errors

3. **Export Functionality Issues**
   - Ensure browser allows file downloads
   - Check data permissions
   - Verify CSV generation logic

### Performance Issues
- Monitor database query performance
- Check for proper indexing
- Optimize component rendering

## Maintenance

### Regular Tasks
- Clean up expired sessions
- Archive old audit logs
- Update system statistics
- Monitor system health

### Database Maintenance
```sql
-- Clean expired sessions
SELECT cleanup_expired_sessions();

-- Archive old audit logs (older than 1 year)
DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 year';
```

## Future Enhancements

### Planned Features
- **Advanced Analytics**: Machine learning insights
- **Bulk Operations**: Mass user/organization management
- **API Management**: REST API monitoring and control
- **Custom Dashboards**: Configurable dashboard layouts
- **Mobile App**: Native mobile administration app

### Integration Opportunities
- **Third-party Services**: CRM integrations
- **Business Intelligence**: Advanced reporting tools
- **Monitoring Systems**: System health monitoring
- **Backup Solutions**: Automated data backup

## Support

For technical support or questions:
- **Documentation**: This file and inline code comments
- **Database Schema**: Check migration files for structure
- **Component API**: TypeScript interfaces for component props
- **Supabase Docs**: Official Supabase documentation

## Contributing

When contributing to the Super Admin Dashboard:
1. Follow existing code patterns and TypeScript types
2. Add proper error handling and loading states
3. Include audit logging for new administrative actions
4. Update this documentation for new features
5. Test with different user roles and permissions

## License

This Super Admin Dashboard is part of the Egypt AI Flow CRM system and follows the same licensing terms as the main application.