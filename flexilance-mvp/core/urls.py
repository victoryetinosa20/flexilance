from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('profile/', views.user_profile, name='user-profile'),
    path('profile/picture/', views.update_profile_picture, name='update-profile-picture'),
    path('my-jobs/', views.my_jobs, name='my-jobs'),
    path('jobs/', views.JobListCreate.as_view(), name='job-list'),
    path('jobs/<int:job_id>/proposals/', views.job_proposals, name='job-proposals'),
    path('proposals/', views.ProposalListCreate.as_view(), name='proposal-list'),
]