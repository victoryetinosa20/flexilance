from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Job, JobCategory
from .serializers import JobSerializer, JobCategorySerializer

class JobListCreateView(generics.ListCreateAPIView):
    serializer_class = JobSerializer
    
    def get_queryset(self):
        queryset = Job.objects.filter(status='open')
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(description__icontains=search) |
                Q(skills_required__icontains=search)
            )
        
        # Category filter
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Budget filter
        budget_type = self.request.query_params.get('budget_type')
        if budget_type:
            queryset = queryset.filter(budget_type=budget_type)
        
        # Experience level filter
        experience = self.request.query_params.get('experience')
        if experience:
            queryset = queryset.filter(experience_level=experience)
        
        return queryset

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        # Only clients can post jobs
        if self.request.user.user_type != 'client':
            return Response(
                {'error': 'Only clients can post jobs'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        serializer.save()

class JobDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def update(self, request, *args, **kwargs):
        job = self.get_object()
        if job.client != request.user:
            return Response(
                {'error': 'You can only edit your own jobs'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        if job.client != request.user:
            return Response(
                {'error': 'You can only delete your own jobs'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class MyJobsView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(client=self.request.user)

class JobCategoriesView(generics.ListAPIView):
    queryset = JobCategory.objects.all()
    serializer_class = JobCategorySerializer
    permission_classes = [permissions.AllowAny]