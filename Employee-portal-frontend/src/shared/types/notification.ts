export interface Notification {
  id: string;
  recipient: string;
  sender: string | null;
  sender_name: string;
  notification_type: string;
  notification_type_display: string;
  title: string;
  message: string;
  is_read: boolean;
  related_url: string;
  created_at: string;
  read_at: string | null;
}
