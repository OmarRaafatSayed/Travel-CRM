import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  type: 'signup' | 'payment' | 'error' | 'approval';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface SuperAdminNotificationsProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SuperAdminNotifications({ open, setOpen }: SuperAdminNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    // Mock notifications - in real implementation, fetch from database
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'signup',
        title: 'New Organization Registration',
        message: 'TechCorp has registered and is pending approval',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'payment',
        title: 'Payment Received',
        message: 'Payment of $150 received from Acme Inc.',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'error',
        title: 'System Error',
        message: 'Database connection timeout in region US-East',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true
      }
    ];
    
    setNotifications(mockNotifications);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signup': return '👤';
      case 'payment': return '💳';
      case 'error': return '⚠️';
      case 'approval': return '✅';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'signup': return 'bg-blue-50 border-blue-200';
      case 'payment': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'approval': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto relative w-screen max-w-md">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-0 top-0 -ml-8 flex pr-2 pt-4 sm:-ml-10 sm:pr-4">
                      <button
                        type="button"
                        className="relative rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={() => setOpen(false)}
                      >
                        <span className="absolute -inset-2.5" />
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  
                  <div className="flex h-full flex-col overflow-y-scroll bg-white py-6 shadow-xl">
                    <div className="px-4 sm:px-6">
                      <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                        System Notifications
                      </Dialog.Title>
                    </div>
                    
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <div className="space-y-4">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg border ${getNotificationColor(notification.type)} ${
                              !notification.read ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <span className="text-2xl">
                                  {getNotificationIcon(notification.type)}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                                    )}
                                  </div>
                                  <p className="mt-1 text-sm text-gray-600">
                                    {notification.message}
                                  </p>
                                  <p className="mt-2 text-xs text-gray-400">
                                    {new Date(notification.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {!notification.read && (
                              <div className="mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  Mark as Read
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {notifications.length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}