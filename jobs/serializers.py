from rest_framework import serializers
from .models import Job, JobCategory
from accounts.serializers import UserSerializer

class JobCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = JobCategory
        fields = '__all__'

class JobSerializer(serializers.ModelSerializer):
    client = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Job
        fields = ('id', 'title', 'description', 'client', 'category', 'category_name',
                 'budget_type', 'budget_min', 'budget_max', 'experience_level',
                 'skills_required', 'status', 'duration', 'attachments',
                 'proposals_count', 'created_at', 'updated_at')
        read_only_fields = ('client', 'proposals_count', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)