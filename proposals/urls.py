from django.urls import path
from . import views

urlpatterns = [
    path('job/<int:job_id>/', views.JobProposalsView.as_view(), name='job-proposals'),
    path('job/<int:job_id>/submit/', views.submit_proposal, name='submit-proposal'),
    path('<int:proposal_id>/accept/', views.accept_proposal, name='accept-proposal'),
    path('my-proposals/', views.MyProposalsView.as_view(), name='my-proposals'),
]