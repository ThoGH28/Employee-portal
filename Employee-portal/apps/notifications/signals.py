"""
Signals to auto-create notifications on key events
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.employees.models import LeaveRequest, WFHRequest
from apps.notifications.models import Notification


def create_notification(recipient, notification_type, title, message, sender=None, related_url=''):
    Notification.objects.create(
        recipient=recipient,
        sender=sender,
        notification_type=notification_type,
        title=title,
        message=message,
        related_url=related_url,
    )


@receiver(post_save, sender=LeaveRequest)
def notify_leave_request(sender, instance, created, **kwargs):
    if created:
        # Notify managers / HR
        from apps.users.models import CustomUser
        hrs = CustomUser.objects.filter(role__in=['admin', 'hr'])
        for hr in hrs:
            create_notification(
                recipient=hr,
                notification_type='leave_request',
                title=f'Đơn nghỉ phép mới từ {instance.employee.get_full_name()}',
                message=f'{instance.get_leave_type_display()} từ {instance.start_date} đến {instance.end_date}',
                sender=instance.employee,
                related_url='/leave-approval',
            )
    else:
        # Notify employee of status change
        if instance.status in ['approved', 'rejected']:
            label = 'approved' if instance.status == 'approved' else 'rejected'
            ntype = f'leave_{label}'
            title = 'Đơn nghỉ phép của bạn đã được duyệt' if instance.status == 'approved' else 'Đơn nghỉ phép bị từ chối'
            create_notification(
                recipient=instance.employee,
                notification_type=ntype,
                title=title,
                message=f'{instance.get_leave_type_display()} {instance.start_date} → {instance.end_date}',
                sender=instance.approved_by,
                related_url='/leave',
            )


@receiver(post_save, sender=WFHRequest)
def notify_wfh_request(sender, instance, created, **kwargs):
    if created:
        from apps.users.models import CustomUser
        hrs = CustomUser.objects.filter(role__in=['admin', 'hr'])
        for hr in hrs:
            create_notification(
                recipient=hr,
                notification_type='wfh_request',
                title=f'Đơn WFH mới từ {instance.employee.get_full_name()}',
                message=f'Từ {instance.start_date} đến {instance.end_date}',
                sender=instance.employee,
                related_url='/wfh',
            )
    else:
        if instance.status in ['approved', 'rejected']:
            label = 'approved' if instance.status == 'approved' else 'rejected'
            title = 'Đơn WFH của bạn đã được duyệt' if instance.status == 'approved' else 'Đơn WFH bị từ chối'
            create_notification(
                recipient=instance.employee,
                notification_type=f'wfh_{label}',
                title=title,
                message=f'{instance.start_date} → {instance.end_date}',
                sender=instance.approved_by,
                related_url='/wfh',
            )
