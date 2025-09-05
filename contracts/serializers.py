from rest_framework import serializers
from .models import Contract, Milestone
from accounts.serializers import UserSerializer
from jobs.serializers import JobSerializer

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = '__all__'
        read_only_fields = ('created_at', 'submitted_at', 'approved_at')

class ContractSerializer(serializers.ModelSerializer):
    freelancer = UserSerializer(read_only=True)
    client = UserSerializer(read_only=True)
    job = JobSerializer(read_only=True)
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = Contract
        fields = '__all__'
        read_only_fields = ('freelancer', 'client', 'job', 'created_at')