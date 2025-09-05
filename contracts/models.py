from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from jobs.models import Job

User = get_user_model()

class Contract(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('disputed', 'Disputed'),
    )

    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='contract')
    freelancer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='freelancer_contracts')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_contracts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    # ✅ Allow blank descriptions for flexibility
    description = models.TextField(blank=True, default="")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # ✅ Use default=timezone.now instead of auto_now_add to avoid migration issues
    start_date = models.DateTimeField(default=timezone.now)
    end_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Contract: {self.job.title}"


class Milestone(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('revision_requested', 'Revision Requested'),
    )

    contract = models.ForeignKey('Contract', on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    deliverables = models.FileField(upload_to='deliverables/', null=True, blank=True)
    feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.contract.job.title} - {self.title}"