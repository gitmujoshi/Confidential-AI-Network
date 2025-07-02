import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Button,
  Divider,
  Badge,
  Grid,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Description,
  CheckCircle,
  Pending,
  Error,
  Person,
  MarkEmailRead,
  Delete,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'CONTRACT_CREATED':
        return <Description color="primary" />;
      case 'CONTRACT_SIGNED':
        return <CheckCircle color="success" />;
      case 'CONTRACT_COMPLETED':
        return <CheckCircle color="info" />;
      case 'CONTRACT_CANCELLED':
        return <Error color="error" />;
      case 'CCRP_SELECTED':
        return <Person color="secondary" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'CONTRACT_CREATED':
        return 'primary';
      case 'CONTRACT_SIGNED':
        return 'success';
      case 'CONTRACT_COMPLETED':
        return 'info';
      case 'CONTRACT_CANCELLED':
        return 'error';
      case 'CCRP_SELECTED':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <ListItem
      sx={{
        backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
        borderRadius: 1,
        mb: 1,
      }}
    >
      <ListItemAvatar>
        <Badge
          color="error"
          variant="dot"
          invisible={notification.isRead}
        >
          <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}.light` }}>
            {getNotificationIcon(notification.type)}
          </Avatar>
        </Badge>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="body1" fontWeight={notification.isRead ? 'normal' : 'medium'}>
              {notification.title}
            </Typography>
            <Chip 
              label={notification.type.replace(/_/g, ' ')} 
              size="small" 
              color={getNotificationColor(notification.type)}
              variant="outlined"
            />
          </Box>
        }
        secondary={
          <Box>
            <Typography variant="body2" color="textSecondary" paragraph>
              {notification.message}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {format(new Date(notification.createdAt), 'MMM dd, yyyy HH:mm')}
            </Typography>
          </Box>
        }
      />
      <Box display="flex" gap={1}>
        {!notification.isRead && (
          <IconButton 
            size="small" 
            onClick={() => onMarkAsRead(notification.id)}
            title="Mark as read"
          >
            <MarkEmailRead />
          </IconButton>
        )}
        <IconButton 
          size="small" 
          onClick={() => onDelete(notification.id)}
          color="error"
          title="Delete notification"
        >
          <Delete />
        </IconButton>
      </Box>
    </ListItem>
  );
};

function Notifications() {
  const [filter, setFilter] = useState('all'); // all, unread, read
  const queryClient = useQueryClient();

  // Fetch notifications for user ID 1 (demo)
  const { data: notificationsResponse } = useQuery(
    ['notifications', filter],
    () => apiService.getNotifications(1, { limit: 50 })
  );

  const notifications = notificationsResponse?.notifications || [];

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications.filter(n => n.isRead);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation(
    (notificationId) => apiService.markNotificationAsRead(notificationId, { userId: 1 }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
        toast.success('Notification marked as read');
      },
      onError: () => {
        toast.error('Failed to mark notification as read');
      },
    }
  );

  const handleMarkAsRead = (notificationId) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleDelete = (notificationId) => {
    // Implement delete functionality
    console.log('Delete notification:', notificationId);
    toast.success('Notification deleted');
  };

  const handleMarkAllAsRead = () => {
    // Implement mark all as read functionality
    console.log('Mark all as read');
    toast.success('All notifications marked as read');
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notifications</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
        </Box>
      </Box>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <NotificationsIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{notifications.length}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Notifications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon sx={{ mr: 2, color: 'warning.main' }} />
                </Badge>
                <Box>
                  <Typography variant="h4">{unreadCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Unread Notifications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4">{notifications.length - unreadCount}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Read Notifications
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center">
            <Button
              variant={filter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'contained' : 'outlined'}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </Button>
            <Button
              variant={filter === 'read' ? 'contained' : 'outlined'}
              onClick={() => setFilter('read')}
            >
              Read ({notifications.length - unreadCount})
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardContent>
          {filteredNotifications.length > 0 ? (
            <List>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box textAlign="center" py={4}>
              <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No notifications found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {filter === 'all' 
                  ? "You don't have any notifications yet"
                  : filter === 'unread'
                  ? "You don't have any unread notifications"
                  : "You don't have any read notifications"
                }
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Notifications; 