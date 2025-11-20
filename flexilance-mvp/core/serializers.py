from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Job, Proposal
from .storage_utils import upload_file, delete_file, get_file_url


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_profile(self, obj):
        """Get profile data for the user"""
        try:
            profile = obj.profile
            return {
                'is_freelancer': profile.is_freelancer,
                'profile_picture': profile.profile_picture.url if profile.profile_picture else None,
                'skills': profile.skills,
                'bio': profile.bio
            }
        except Profile.DoesNotExist:
            return None


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for Profile model"""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = [
            'id', 'username', 'email', 'is_freelancer', 'profile_picture',
            'profile_picture_url', 'skills', 'bio', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_profile_picture_url(self, obj):
        """Get profile picture URL if exists"""
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

    def update(self, instance, validated_data):
        """Handle profile picture upload using storage utilities"""
        profile_picture = validated_data.get('profile_picture')
        
        if profile_picture:
            # Upload the file using storage utilities
            upload_result = upload_file(profile_picture, folder='profiles')
            
            if upload_result['success']:
                # For local storage, the file is automatically saved
                # For Cloudinary, we need to update the filename
                if upload_result['storage_backend'] == 'cloudinary':
                    validated_data['profile_picture'].name = upload_result['public_id']
                else:
                    validated_data['profile_picture'].name = upload_result['filename']
        
        return super().update(instance, validated_data)


class JobSerializer(serializers.ModelSerializer):
    """Serializer for Job model"""
    client_name = serializers.CharField(source='client.username', read_only=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'title', 'description', 'budget', 'client', 'client_name',
            'client_email', 'skills_required', 'deadline', 'attachment',
            'attachment_url', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['client', 'created_at', 'updated_at']

    def get_attachment_url(self, obj):
        """Get attachment URL if exists"""
        if obj.attachment:
            return obj.attachment.url
        return None

    def create(self, validated_data):
        """Handle job attachment upload using storage utilities"""
        attachment = validated_data.get('attachment')
        
        if attachment:
            # Upload the file using storage utilities
            upload_result = upload_file(attachment, folder='jobs')
            
            if upload_result['success']:
                # For local storage, the file is automatically saved
                # For Cloudinary, we need to update the filename
                if upload_result['storage_backend'] == 'cloudinary':
                    validated_data['attachment'].name = upload_result['public_id']
                else:
                    validated_data['attachment'].name = upload_result['filename']
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Handle job attachment upload using storage utilities"""
        attachment = validated_data.get('attachment')
        
        if attachment:
            # Upload the file using storage utilities
            upload_result = upload_file(attachment, folder='jobs')
            
            if upload_result['success']:
                # For local storage, the file is automatically saved
                # For Cloudinary, we need to update the filename
                if upload_result['storage_backend'] == 'cloudinary':
                    validated_data['attachment'].name = upload_result['public_id']
                else:
                    validated_data['attachment'].name = upload_result['filename']
        
        return super().update(instance, validated_data)


class ProposalSerializer(serializers.ModelSerializer):
    """Serializer for Proposal model"""
    freelancer_name = serializers.CharField(source='freelancer.username', read_only=True)
    freelancer_email = serializers.CharField(source='freelancer.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    job_budget = serializers.DecimalField(source='job.budget', read_only=True, max_digits=10, decimal_places=2)
    proposal_attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Proposal
        fields = [
            'id', 'job', 'job_title', 'job_budget', 'freelancer', 'freelancer_name',
            'freelancer_email', 'cover_letter', 'bid_amount', 'delivery_time',
            'proposal_attachment', 'proposal_attachment_url', 'status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['freelancer', 'status', 'created_at', 'updated_at']

    def get_proposal_attachment_url(self, obj):
        """Get proposal attachment URL if exists"""
        if obj.proposal_attachment:
            return obj.proposal_attachment.url
        return None

    def create(self, validated_data):
        """Handle proposal attachment upload using storage utilities"""
        proposal_attachment = validated_data.get('proposal_attachment')
        
        if proposal_attachment:
            # Upload the file using storage utilities
            upload_result = upload_file(proposal_attachment, folder='proposals')
            
            if upload_result['success']:
                # For local storage, the file is automatically saved
                # For Cloudinary, we need to update the filename
                if upload_result['storage_backend'] == 'cloudinary':
                    validated_data['proposal_attachment'].name = upload_result['public_id']
                else:
                    validated_data['proposal_attachment'].name = upload_result['filename']
        
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Handle proposal attachment upload using storage utilities"""
        proposal_attachment = validated_data.get('proposal_attachment')
        
        if proposal_attachment:
            # Upload the file using storage utilities
            upload_result = upload_file(proposal_attachment, folder='proposals')
            
            if upload_result['success']:
                # For local storage, the file is automatically saved
                # For Cloudinary, we need to update the filename
                if upload_result['storage_backend'] == 'cloudinary':
                    validated_data['proposal_attachment'].name = upload_result['public_id']
                else:
                    validated_data['proposal_attachment'].name = upload_result['filename']
        
        return super().update(instance, validated_data)


class RegisterSerializer(serializers.Serializer):
    """Serializer for user registration"""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    is_freelancer = serializers.BooleanField(default=False)
    skills = serializers.CharField(required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        """Validate that username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")
        return value

    def validate_email(self, value):
        """Validate that email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def create(self, validated_data):
        """Create user and update profile"""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        
        # Profile is automatically created by signal, just update it
        profile = user.profile
        profile.is_freelancer = validated_data['is_freelancer']
        profile.skills = validated_data.get('skills', '')
        profile.bio = validated_data.get('bio', '')
        profile.save()
        
        return user