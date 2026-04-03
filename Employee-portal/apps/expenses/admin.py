from django.contrib import admin
from apps.expenses.models import ExpenseReport, ExpenseItem

@admin.register(ExpenseReport)
class ExpenseReportAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'total_amount', 'status', 'approved_by', 'created_at']
    list_filter = ['status']
    search_fields = ['employee__username', 'title']

@admin.register(ExpenseItem)
class ExpenseItemAdmin(admin.ModelAdmin):
    list_display = ['report', 'category', 'description', 'amount', 'expense_date']
    list_filter = ['category']
