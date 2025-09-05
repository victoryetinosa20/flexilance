from django.urls import path
from . import views

urlpatterns = [
    path('my-contracts/', views.MyContractsView.as_view(), name='my-contracts'),
    path('<int:pk>/', views.ContractDetailView.as_view(), name='contract-detail'),
]