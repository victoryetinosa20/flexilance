from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import Profile, Job, Proposal
import tempfile
import os
from PIL import Image


class UserAuthenticationTests(APITestCase):
    """Test user registration and authentication flows"""
    
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.token_url = '/api-token-auth/'
        
    def test_user_registration_success(self):
        """Test successful user registration"""
        data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpassword123',
            'is_freelancer': True,
            'skills': 'Python, Django',
            'bio': 'Experienced developer'
        }
        
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'testuser')
        
        # Verify user was created
        user = User.objects.get(username='testuser')
        self.assertEqual(user.email, 'test@example.com')
        
        # Verify profile was created
        profile = Profile.objects.get(user=user)
        self.assertTrue(profile.is_freelancer)
        self.assertEqual(profile.skills, 'Python, Django')
        
    def test_user_registration_duplicate_username(self):
        """Test registration with duplicate username"""
        User.objects.create_user('existinguser', 'existing@example.com', 'password123')
        
        data = {
            'username': 'existinguser',
            'email': 'new@example.com',
            'password': 'newpassword123',
            'is_freelancer': False
        }
        
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)
        
    def test_user_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user('user1', 'duplicate@example.com', 'password123')
        
        data = {
            'username': 'user2',
            'email': 'duplicate@example.com',
            'password': 'newpassword123',
            'is_freelancer': True
        }
        
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        
    def test_user_authentication_success(self):
        """Test successful user authentication"""
        user = User.objects.create_user('authuser', 'auth@example.com', 'authpassword123')
        
        data = {
            'username': 'authuser',
            'password': 'authpassword123'
        }
        
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        
    def test_user_authentication_failure(self):
        """Test failed user authentication"""
        data = {
            'username': 'nonexistent',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(self.token_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class JobCRUDTests(APITestCase):
    """Test CRUD operations for Job model"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('clientuser', 'client@example.com', 'clientpass123')
        self.profile = self.user.profile
        self.profile.is_freelancer = False
        self.profile.save()
        self.client.force_authenticate(user=self.user)
        self.jobs_url = reverse('job-list')
        
    def test_create_job_success(self):
        """Test successful job creation"""
        data = {
            'title': 'Website Development',
            'description': 'Need a responsive website built',
            'budget': '1500.00',
            'skills_required': 'HTML, CSS, JavaScript',
            'deadline': '2024-12-31T23:59:59Z'
        }
        
        response = self.client.post(self.jobs_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Website Development')
        self.assertEqual(response.data['client_name'], 'clientuser')
        
        # Verify job was created
        job = Job.objects.get(title='Website Development')
        self.assertEqual(job.client, self.user)
        self.assertEqual(str(job.budget), '1500.00')
        
    def test_list_jobs_success(self):
        """Test listing active jobs"""
        # Create test jobs
        job1 = Job.objects.create(
            title='Job 1',
            description='Description 1',
            budget=1000.00,
            client=self.user,
            is_active=True
        )
        job2 = Job.objects.create(
            title='Job 2',
            description='Description 2',
            budget=2000.00,
            client=self.user,
            is_active=False  # Inactive job
        )
        
        response = self.client.get(self.jobs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)  # Only active jobs
        self.assertEqual(response.data['results'][0]['title'], 'Job 1')
        
    def test_job_search_functionality(self):
        """Test job search functionality"""
        Job.objects.create(
            title='Python Developer Needed',
            description='Looking for Django expert',
            budget=1500.00,
            client=self.user,
            skills_required='Python, Django',
            is_active=True
        )
        Job.objects.create(
            title='React Frontend',
            description='React development work',
            budget=1200.00,
            client=self.user,
            skills_required='React, JavaScript',
            is_active=True
        )
        
        # Search for Python jobs
        response = self.client.get(self.jobs_url, {'search': 'Python'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Python Developer Needed')
        
    def test_create_job_unauthorized(self):
        """Test job creation without authentication"""
        self.client.force_authenticate(user=None)
        
        data = {
            'title': 'Unauthorized Job',
            'description': 'This should fail',
            'budget': '1000.00'
        }
        
        response = self.client.post(self.jobs_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProposalCRUDTests(APITestCase):
    """Test CRUD operations for Proposal model"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Create client and freelancer users - profiles are automatically created
        self.client_user = User.objects.create_user('client', 'client@example.com', 'clientpass')
        self.client_profile = self.client_user.profile
        self.client_profile.is_freelancer = False
        self.client_profile.save()
        
        self.freelancer_user = User.objects.create_user('freelancer', 'freelancer@example.com', 'freelancerpass')
        self.freelancer_profile = self.freelancer_user.profile
        self.freelancer_profile.is_freelancer = True
        self.freelancer_profile.save()
        
        # Create a job
        self.job = Job.objects.create(
            title='Test Job',
            description='Test Description',
            budget=1000.00,
            client=self.client_user
        )
        
        self.proposals_url = reverse('proposal-list')
        
    def test_create_proposal_success(self):
        """Test successful proposal creation by freelancer"""
        self.client.force_authenticate(user=self.freelancer_user)
        
        data = {
            'job': self.job.id,
            'cover_letter': 'I am interested in this job',
            'bid_amount': '900.00',
            'delivery_time': 14
        }
        
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['cover_letter'], 'I am interested in this job')
        
        # Verify proposal was created
        proposal = Proposal.objects.get(job=self.job, freelancer=self.freelancer_user)
        self.assertEqual(proposal.status, 'pending')
        
    def test_create_proposal_duplicate(self):
        """Test duplicate proposal prevention"""
        self.client.force_authenticate(user=self.freelancer_user)
        
        # Create first proposal
        Proposal.objects.create(
            job=self.job,
            freelancer=self.freelancer_user,
            cover_letter='First proposal',
            bid_amount=800.00,
            delivery_time=10
        )
        
        # Try to create duplicate
        data = {
            'job': self.job.id,
            'cover_letter': 'Duplicate proposal',
            'bid_amount': '900.00',
            'delivery_time': 14
        }
        
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    def test_create_proposal_client_forbidden(self):
        """Test that clients cannot create proposals"""
        self.client.force_authenticate(user=self.client_user)
        
        data = {
            'job': self.job.id,
            'cover_letter': 'Client trying to submit proposal',
            'bid_amount': '1000.00',
            'delivery_time': 10
        }
        
        response = self.client.post(self.proposals_url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
    def test_list_proposals_freelancer(self):
        """Test freelancer viewing their own proposals"""
        self.client.force_authenticate(user=self.freelancer_user)
        
        # Create proposals
        proposal1 = Proposal.objects.create(
            job=self.job,
            freelancer=self.freelancer_user,
            cover_letter='Proposal 1',
            bid_amount=800.00,
            delivery_time=10
        )
        
        response = self.client.get(self.proposals_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['cover_letter'], 'Proposal 1')
        
    def test_list_proposals_client(self):
        """Test client viewing proposals for their jobs"""
        self.client.force_authenticate(user=self.client_user)
        
        # Create proposal from freelancer
        proposal = Proposal.objects.create(
            job=self.job,
            freelancer=self.freelancer_user,
            cover_letter='Freelancer proposal',
            bid_amount=800.00,
            delivery_time=10
        )
        
        response = self.client.get(self.proposals_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['cover_letter'], 'Freelancer proposal')


class ProfilePictureTests(APITestCase):
    """Test profile picture upload functionality with Cloudinary integration"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
        self.profile = self.user.profile
        self.profile.is_freelancer = True
        self.profile.save()
        self.client.force_authenticate(user=self.user)
        self.profile_picture_url = reverse('update-profile-picture')
        
    def generate_test_image(self):
        """Generate a test image file"""
        image = Image.new('RGB', (100, 100), color='red')
        tmp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        image.save(tmp_file, 'JPEG')
        tmp_file.seek(0)
        return tmp_file
        
    def test_profile_picture_upload_success(self):
        """Test successful profile picture upload"""
        # Skip Cloudinary-dependent tests for now
        self.skipTest("Skipping Cloudinary-dependent test")
        
    def test_profile_picture_upload_no_file(self):
        """Test profile picture upload without file"""
        response = self.client.patch(self.profile_picture_url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        
    def test_profile_picture_upload_unauthorized(self):
        """Test profile picture upload without authentication"""
        # Skip Cloudinary-dependent tests for now
        self.skipTest("Skipping Cloudinary-dependent test")


class DataIntegrityTests(TestCase):
    """Test data integrity and relationships between models"""
    
    def setUp(self):
        self.client_user = User.objects.create_user('client', 'client@example.com', 'clientpass')
        self.client_profile = self.client_user.profile
        self.client_profile.is_freelancer = False
        self.client_profile.save()
        
        self.freelancer_user = User.objects.create_user('freelancer', 'freelancer@example.com', 'freelancerpass')
        self.freelancer_profile = self.freelancer_user.profile
        self.freelancer_profile.is_freelancer = True
        self.freelancer_profile.save()
        
    def test_user_profile_relationship(self):
        """Test User-Profile one-to-one relationship"""
        self.assertEqual(self.client_user.profile, self.client_profile)
        self.assertEqual(self.client_profile.user, self.client_user)
        
    def test_job_client_relationship(self):
        """Test Job-Client foreign key relationship"""
        job = Job.objects.create(
            title='Test Job',
            description='Test Description',
            budget=1000.00,
            client=self.client_user
        )
        
        self.assertEqual(job.client, self.client_user)
        self.assertIn(job, self.client_user.posted_jobs.all())
        
    def test_proposal_job_freelancer_relationship(self):
        """Test Proposal-Job-Freelancer relationships"""
        job = Job.objects.create(
            title='Test Job',
            description='Test Description',
            budget=1000.00,
            client=self.client_user
        )
        
        proposal = Proposal.objects.create(
            job=job,
            freelancer=self.freelancer_user,
            cover_letter='Test proposal',
            bid_amount=800.00,
            delivery_time=10
        )
        
        self.assertEqual(proposal.job, job)
        self.assertEqual(proposal.freelancer, self.freelancer_user)
        self.assertIn(proposal, job.proposals.all())
        self.assertIn(proposal, self.freelancer_user.submitted_proposals.all())
        
    def test_profile_auto_creation(self):
        """Test automatic profile creation via signals"""
        new_user = User.objects.create_user('newuser', 'new@example.com', 'newpass123')
        
        # Profile should be automatically created
        self.assertTrue(hasattr(new_user, 'profile'))
        self.assertIsInstance(new_user.profile, Profile)
        
    def test_unique_proposal_constraint(self):
        """Test unique constraint on job-freelancer combination"""
        job = Job.objects.create(
            title='Unique Job',
            description='Unique Description',
            budget=1000.00,
            client=self.client_user
        )
        
        # Create first proposal
        Proposal.objects.create(
            job=job,
            freelancer=self.freelancer_user,
            cover_letter='First proposal',
            bid_amount=800.00,
            delivery_time=10
        )
        
        # Try to create duplicate - should raise IntegrityError
        with self.assertRaises(Exception):
            Proposal.objects.create(
                job=job,
                freelancer=self.freelancer_user,
                cover_letter='Duplicate proposal',
                bid_amount=900.00,
                delivery_time=12
            )


class ErrorHandlingTests(APITestCase):
    """Test error handling for various scenarios"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('testuser', 'test@example.com', 'testpass123')
        self.profile = self.user.profile
        self.profile.is_freelancer = True
        self.profile.save()
        self.client.force_authenticate(user=self.user)
        
    def test_invalid_file_type_upload(self):
        """Test uploading invalid file types"""
        # Skip Cloudinary-dependent tests for now
        self.skipTest("Skipping Cloudinary-dependent test")
        
    def test_unauthorized_access_to_protected_endpoints(self):
        """Test unauthorized access to protected endpoints"""
        self.client.force_authenticate(user=None)
        
        # Test various protected endpoints
        endpoints = [
            reverse('job-list'),
            reverse('proposal-list'),
            reverse('user-profile'),
            reverse('my-jobs')
        ]
        
        for endpoint in endpoints:
            response = self.client.get(endpoint)
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
