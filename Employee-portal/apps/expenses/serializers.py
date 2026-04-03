from rest_framework import serializers
from apps.expenses.models import ExpenseReport, ExpenseItem


class ExpenseItemSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = ExpenseItem
        fields = [
            'id', 'report', 'category', 'category_display',
            'description', 'amount', 'expense_date', 'receipt_file', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ExpenseReportSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = ExpenseItemSerializer(many=True, read_only=True)

    class Meta:
        model = ExpenseReport
        fields = [
            'id', 'employee', 'employee_name',
            'title', 'description', 'total_amount',
            'status', 'status_display',
            'approved_by', 'approved_by_name', 'approval_comment',
            'approved_at', 'payment_date',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_amount', 'approved_by', 'approved_at', 'created_at', 'updated_at']


class ExpenseApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected', 'paid'])
    approval_comment = serializers.CharField(required=False, allow_blank=True)
    payment_date = serializers.DateField(required=False, allow_null=True)
