from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Profile, Job, Proposal
from .serializers import (
    JobSerializer, ProposalSerializer, RegisterSerializer,
    UserSerializer
)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    """
    Register a new user with profile
    """
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': 'User created successfully',
            'user_id': user.id,
            'username': user.username
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class JobListCreate(generics.ListCreateAPIView):
    """
    List all active jobs or create a new job
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return active jobs, optionally filtered by search query
        """
        queryset = Job.objects.filter(is_active=True)
        
        # Filter by search query if provided
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(skills_required__icontains=search_query)
            )
        
        return queryset

    def perform_create(self, serializer):
        """
        Set the client to the current user when creating a job
        """
        serializer.save(client=self.request.user)


class ProposalListCreate(generics.ListCreateAPIView):
    """
    List all proposals or create a new proposal
    """
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Return proposals based on user role
        """
        user = self.request.user
        
        # If user is a freelancer, show their own proposals
        if hasattr(user, 'profile') and user.profile.is_freelancer:
            return Proposal.objects.filter(freelancer=user)
        
        # If user is a client, show proposals for their jobs
        return Proposal.objects.filter(job__client=user)

    def perform_create(self, serializer):
        """
        Set the freelancer to the current user when creating a proposal
        Validate that only freelancers can create proposals
        """
        user = self.request.user
        
        # Check if user is a freelancer
        if not hasattr(user, 'profile') or not user.profile.is_freelancer:
            raise PermissionDenied("Only freelancers can submit proposals")
        
        # Check if user has already submitted a proposal for this job
        job = serializer.validated_data['job']
        if Proposal.objects.filter(job=job, freelancer=user).exists():
            from rest_framework import serializers
            raise serializers.ValidationError("You have already submitted a proposal for this job")
        
        serializer.save(freelancer=user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_profile(request):
    """
    Get current user's profile information
    """
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_profile_picture(request):
    """
    Update user's profile picture
    """
    user = request.user
    profile = user.profile
    
    if 'profile_picture' in request.FILES:
        profile.profile_picture = request.FILES['profile_picture']
        profile.save()
        
        return Response({
            'message': 'Profile picture updated successfully',
            'profile_picture_url': profile.profile_picture.url if profile.profile_picture else None
        }, status=status.HTTP_200_OK)
    
    return Response(
        {'error': 'No profile picture provided'},
        status=status.HTTP_400_BAD_REQUEST
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_jobs(request):
    """
    Get jobs posted by the current user (for clients)
    """
    if not hasattr(request.user, 'profile') or request.user.profile.is_freelancer:
        return Response(
            {'error': 'Only clients can view their posted jobs'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    jobs = Job.objects.filter(client=request.user)
    serializer = JobSerializer(jobs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def job_proposals(request, job_id):
    """
    Get proposals for a specific job (for job owners)
    """
    try:
        job = Job.objects.get(id=job_id, client=request.user)
    except Job.DoesNotExist:
        return Response(
            {'error': 'Job not found or you are not the owner'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    proposals = Proposal.objects.filter(job=job)
    serializer = ProposalSerializer(proposals, many=True)
    return Response(serializer.data)
