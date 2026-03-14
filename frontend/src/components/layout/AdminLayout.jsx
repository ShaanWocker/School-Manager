import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Breadcrumbs,
  Link,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  School,
  Subject,
  Class,
  CalendarToday,
  CheckCircle,
  Assessment,
  Settings,
  Logout,
  AccountCircle,
  NavigateNext,
  Assignment,
  AttachMoney,
  ChildCare,
  Book,
  MenuBook,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { authService } from '../../services/authService';

const DRAWER_WIDTH = 260;

const BRAND_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const PRIMARY_COLOR = '#667eea';
const SECONDARY_COLOR = '#764ba2';

// ----- Role-based menu definitions -----

const SUPER_ADMIN_MENU = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'User Management', icon: <People />, path: '/users', roles: ['SUPER_ADMIN'] },
  { label: 'Students', icon: <School />, path: '/students' },
  { label: 'Teachers', icon: <People />, path: '/teachers' },
  { label: 'Subjects', icon: <Subject />, path: '/subjects' },
  { label: 'Classes', icon: <Class />, path: '/classes' },
  { label: 'Timetable', icon: <CalendarToday />, path: '/timetable' },
  { label: 'Attendance', icon: <CheckCircle />, path: '/attendance' },
  { label: 'Grades', icon: <Assessment />, path: '/grades' },
  { label: 'Fees', icon: <AttachMoney />, path: '/fees' },
  { label: 'Reports', icon: <Assessment />, path: '/reports' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
];

const PRINCIPAL_MENU = SUPER_ADMIN_MENU.filter((item) => !item.roles?.includes('SUPER_ADMIN'));

const TEACHER_MENU = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'My Classes', icon: <Class />, path: '/classes' },
  { label: 'Students', icon: <School />, path: '/students' },
  { label: 'Lessons', icon: <MenuBook />, path: '/lessons' },
  { label: 'Assignments', icon: <Assignment />, path: '/assignments' },
  { label: 'Grades', icon: <Assessment />, path: '/grades' },
  { label: 'Attendance', icon: <CheckCircle />, path: '/attendance' },
];

const STUDENT_MENU = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'My Classes', icon: <Class />, path: '/classes' },
  { label: 'Lessons', icon: <MenuBook />, path: '/lessons' },
  { label: 'Assignments', icon: <Assignment />, path: '/assignments' },
  { label: 'Grades', icon: <Assessment />, path: '/grades' },
  { label: 'My Attendance', icon: <CheckCircle />, path: '/attendance' },
];

const PARENT_MENU = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'My Children', icon: <ChildCare />, path: '/children' },
  { label: 'Grades', icon: <Assessment />, path: '/grades' },
  { label: 'Attendance', icon: <CheckCircle />, path: '/attendance' },
  { label: 'Fees', icon: <AttachMoney />, path: '/fees' },
];

function getMenuItems(role) {
  switch (role) {
    case 'SUPER_ADMIN':
      return SUPER_ADMIN_MENU;
    case 'PRINCIPAL':
      return PRINCIPAL_MENU;
    case 'TEACHER':
      return TEACHER_MENU;
    case 'STUDENT':
      return STUDENT_MENU;
    case 'PARENT':
      return PARENT_MENU;
    default:
      return SUPER_ADMIN_MENU;
  }
}

// ----- Breadcrumb helper -----

function buildBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', path: '/' }];
  let accumulated = '';
  segments.forEach((seg) => {
    accumulated += `/${seg}`;
    crumbs.push({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      path: accumulated,
    });
  });
  return crumbs;
}

// ----- Sidebar content -----

function SidebarContent({ menuItems, location, onItemClick }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand header */}
      <Box
        sx={{
          background: BRAND_GRADIENT,
          py: 3,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Book sx={{ color: '#fff', fontSize: 32 }} />
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
          School
          <br />
          Manager
        </Typography>
      </Box>

      <Divider />

      {/* Navigation list */}
      <List sx={{ flex: 1, py: 1 }}>
        {menuItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => onItemClick(item.path)}
                sx={{
                  mx: 1,
                  my: 0.25,
                  borderRadius: 2,
                  ...(isActive && {
                    background: BRAND_GRADIENT,
                    '& .MuiListItemIcon-root': { color: '#fff' },
                    '& .MuiListItemText-primary': { color: '#fff', fontWeight: 600 },
                  }),
                  '&:hover': {
                    background: isActive ? BRAND_GRADIENT : 'rgba(102,126,234,0.10)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#fff' : PRIMARY_COLOR,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#fff' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}

// ----- Main AdminLayout component -----

function getUserInitials(user) {
  if (!user) return 'U';
  const firstInitial = user.firstName?.[0] ?? '';
  const lastInitial = user.lastName?.[0] ?? '';
  const nameInitials = (firstInitial + lastInitial).toUpperCase();
  if (nameInitials) return nameInitials;
  return user.email?.[0]?.toUpperCase() ?? 'U';
}

function getUserDisplayName(user) {
  if (!user) return 'User';
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return fullName || user.email || 'User';
}

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const user = authService.getStoredUser();
  const role = user?.role || 'SUPER_ADMIN';
  const menuItems = getMenuItems(role);
  const breadcrumbs = buildBreadcrumbs(location.pathname);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleProfileMenuClose = () => setAnchorEl(null);

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    authService.logout();
    navigate('/login');
  };

  const profileMenuOpen = Boolean(anchorEl);

  const drawerContent = (
    <SidebarContent
      menuItems={menuItems}
      location={location}
      onItemClick={handleNavigate}
    />
  );

  const userInitials = getUserInitials(user);
  const userDisplayName = getUserDisplayName(user);

  const roleLabel = role
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* ---- App Bar ---- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#fff',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {/* Hamburger (mobile only) */}
          <IconButton
            color="inherit"
            aria-label="open navigation menu"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          {/* Breadcrumbs */}
          <Breadcrumbs
            separator={<NavigateNext fontSize="small" />}
            aria-label="breadcrumb"
            sx={{ flex: 1, display: { xs: 'none', sm: 'flex' } }}
          >
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return isLast ? (
                <Typography key={crumb.path} color="text.primary" fontSize={14} fontWeight={600}>
                  {crumb.label}
                </Typography>
              ) : (
                <Link
                  key={crumb.path}
                  component={RouterLink}
                  to={crumb.path}
                  underline="hover"
                  color="inherit"
                  fontSize={14}
                >
                  {crumb.label}
                </Link>
              );
            })}
          </Breadcrumbs>

          <Box sx={{ flex: 1 }} />

          {/* User profile button */}
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              aria-controls={profileMenuOpen ? 'profile-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={profileMenuOpen ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  background: BRAND_GRADIENT,
                  width: 36,
                  height: 36,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {userInitials}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Profile dropdown menu */}
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={profileMenuOpen}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 4,
              sx: { mt: 1, minWidth: 200, borderRadius: 2 },
            }}
          >
            {/* User info header */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {userDisplayName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roleLabel}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => handleNavigate('/profile')}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ---- Sidebar: temporary drawer on mobile ---- */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* ---- Sidebar: permanent drawer on desktop ---- */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>

      {/* ---- Main content ---- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Spacer for AppBar height */}
        <Toolbar />

        {/* Page content rendered via nested routes */}
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
