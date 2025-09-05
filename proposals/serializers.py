from rest_framework import serializers
from .models import Proposal
from accounts.serializers import UserSerializer
from jobs.serializers import JobSerializer

class ProposalSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    job = JobSerializer(read_only=True)

    class Meta:
        model = Proposal
        fields = ('id', 'job', 'freelancer', 'cover_letter', 'bid_amount',
                 'delivery_time', 'status', 'attachments', 'created_at', 'updated_at')
        read_only_fields = ('freelancer', 'status', 'created_at', 'updated_at')

class CreateProposalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proposal
        fields = ('cover_letter', 'bid_amount', 'delivery_time', 'attachments')