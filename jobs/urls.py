from django.urls import path
from . import views

urlpatterns = [
    path('', views.JobListCreateView.as_view(), name='job-list-create'),
    path('<int:pk>/', views.JobDetailView.as_view(), name='job-detail'),
    path('my-jobs/', views.MyJobsView.as_view(), name='my-jobs'),
    path('categories/', views.JobCategoriesView.as_view(), name='job-categories'),
]