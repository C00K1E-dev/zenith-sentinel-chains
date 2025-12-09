import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, MailOpen, Trash2, Check, AlertCircle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAgentNotifications, markAsRead, deleteNotification, type Notification } from '@/services/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
}

export default function NotificationPanel({ agentId, agentName, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadNotifications();
  }, [agentId]);

  const loadNotifications = async () => {
    setLoading(true);
    const data = await getAgentNotifications(agentId, false);
    setNotifications(data);
    setLoading(false);
  };

  const handleMarkAsRead = async (ids: string[]) => {
    const success = await markAsRead(ids);
    if (success) {
      setNotifications(notifications.map(n => 
        ids.includes(n.id) ? { ...n, is_read: true } : n
      ));
      setSelectedIds([]);
    }
  };

  const handleDelete = async (ids: string[]) => {
    const success = await deleteNotification(ids);
    if (success) {
      setNotifications(notifications.filter(n => !ids.includes(n.id)));
      setSelectedIds([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info size={18} className="text-blue-500" />;
      case 'warning':
        return <AlertCircle size={18} className="text-yellow-500" />;
      case 'error':
        return <XCircle size={18} className="text-red-500" />;
      case 'success':
        return <CheckCircle size={18} className="text-green-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card border border-primary/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="text-primary" size={24} />
              Notifications
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {agentName} • {unreadCount} unread
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted/20 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Bulk Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-muted/30">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-xs bg-muted/20 hover:bg-muted/30 rounded-lg transition flex items-center gap-1"
            >
              <Check size={14} />
              {selectedIds.length === notifications.length ? 'Deselect All' : 'Select All'}
            </button>
            
            {selectedIds.length > 0 && (
              <>
                <button
                  onClick={() => handleMarkAsRead(selectedIds)}
                  className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 rounded-lg transition flex items-center gap-1"
                >
                  <MailOpen size={14} />
                  Mark as Read ({selectedIds.length})
                </button>
                <button
                  onClick={() => handleDelete(selectedIds)}
                  className="px-3 py-1.5 text-xs bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete ({selectedIds.length})
                </button>
              </>
            )}
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <MailOpen size={48} className="mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll be notified about subscription renewals and important updates
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`p-4 rounded-lg border transition cursor-pointer ${
                    notification.is_read
                      ? 'bg-muted/5 border-muted/20'
                      : 'bg-primary/5 border-primary/30'
                  } ${
                    selectedIds.includes(notification.id)
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                  onClick={() => toggleSelect(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox */}
                    <div
                      className={`mt-1 w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                        selectedIds.includes(notification.id)
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {selectedIds.includes(notification.id) && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`font-semibold ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead([notification.id]);
                          }}
                          className="p-1.5 hover:bg-blue-500/20 text-blue-500 rounded transition"
                          title="Mark as read"
                        >
                          <MailOpen size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete([notification.id]);
                        }}
                        className="p-1.5 hover:bg-red-500/20 text-red-500 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
