from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class JobCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Job(models.Model):
    BUDGET_TYPES = (
        ('fixed', 'Fixed Price'),
        ('hourly', 'Hourly Rate'),
    )
    
    EXPERIENCE_LEVELS = (
        ('entry', 'Entry Level'),
        ('intermediate', 'Intermediate'),
        ('expert', 'Expert'),
    )
    
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    title = models.CharField(max_length=200)
    description = models.TextField()
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posted_jobs')
    category = models.ForeignKey(JobCategory, on_delete=models.SET_NULL, null=True)
    budget_type = models.CharField(max_length=20, choices=BUDGET_TYPES)
    budget_min = models.DecimalField(
    max_digits=10,
    decimal_places=2,
    default=0.00  
)
    budget_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    experience_level = models.CharField(
    max_length=20,
    choices=EXPERIENCE_LEVELS,
    default='entry'
)
    skills_required = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    duration = models.CharField(max_length=100, blank=True)
    attachments = models.FileField(upload_to='job_attachments/', null=True, blank=True)
    proposals_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
