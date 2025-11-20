from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile, Job, Proposal


class ProfileInline(admin.StackedInline):
    """Inline admin descriptor for Profile model"""
    model = Profile
    can_delete = False
    verbose_name_plural = 'profile'


class UserAdmin(BaseUserAdmin):
    """Custom User Admin with Profile inline"""
    inlines = [ProfileInline]


class JobAdmin(admin.ModelAdmin):
    """Admin configuration for Job model"""
    list_display = ['title', 'client', 'budget', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at', 'client']
    search_fields = ['title', 'description', 'client__username']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'budget', 'client')
        }),
        ('Additional Details', {
            'fields': ('skills_required', 'deadline', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class ProposalAdmin(admin.ModelAdmin):
    """Admin configuration for Proposal model"""
    list_display = ['job', 'freelancer', 'bid_amount', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['job__title', 'freelancer__username', 'cover_letter']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Proposal Details', {
            'fields': ('job', 'freelancer', 'cover_letter', 'bid_amount', 'delivery_time')
        }),
        ('Status', {
            'fields': ('status',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

# Register our models
admin.site.register(Job, JobAdmin)
admin.site.register(Proposal, ProposalAdmin)
