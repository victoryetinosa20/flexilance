from django.urls import path
from . import views

urlpatterns = [
    path('history/', views.PaymentHistoryView.as_view(), name='payment-history'),
    path('earnings/', views.EarningsView.as_view(), name='earnings'),
    path('earnings/summary/', views.earnings_summary, name='earnings-summary'),
]