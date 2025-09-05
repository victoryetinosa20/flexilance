from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from jobs.models import Job
from .models import Proposal
from .serializers import ProposalSerializer, CreateProposalSerializer

class JobProposalsView(generics.ListAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        job_id = self.kwargs['job_id']
        job = get_object_or_404(Job, id=job_id)
        
        # Only job owner can see proposals
        if job.client != self.request.user:
            return Proposal.objects.none()
        
        return Proposal.objects.filter(job=job)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_proposal(request, job_id):
    job = get_object_or_404(Job, id=job_id)
    
    # Only freelancers can submit proposals
    if request.user.user_type != 'freelancer':
        return Response(
            {'error': 'Only freelancers can submit proposals'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if proposal already exists
    if Proposal.objects.filter(job=job, freelancer=request.user).exists():
        return Response(
            {'error': 'You have already submitted a proposal for this job'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    serializer = CreateProposalSerializer(data=request.data)
    if serializer.is_valid():
        proposal = serializer.save(job=job, freelancer=request.user)
        
        # Update job proposals count
        job.proposals_count += 1
        job.save()
        
        return Response(ProposalSerializer(proposal).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_proposal(request, proposal_id):
    proposal = get_object_or_404(Proposal, id=proposal_id)
    
    # Only job owner can accept proposals
    if proposal.job.client != request.user:
        return Response(
            {'error': 'You can only accept proposals for your jobs'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    proposal.status = 'accepted'
    proposal.save()
    
    # Update job status
    proposal.job.status = 'in_progress'
    proposal.job.save()
    
    # Create contract
    from contracts.models import Contract
    contract = Contract.objects.create(
        job=proposal.job,
        freelancer=proposal.freelancer,
        client=proposal.job.client,
        amount=proposal.bid_amount,
        description=proposal.cover_letter
    )
    
    return Response({'message': 'Proposal accepted and contract created'})

class MyProposalsView(generics.ListAPIView):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Proposal.objects.filter(freelancer=self.request.user)