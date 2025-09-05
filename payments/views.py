from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum
from .models import Payment, Earning
from .serializers import PaymentSerializer, EarningSerializer

class PaymentHistoryView(generics.ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Payment.objects.filter(
            models.Q(payer=user) | models.Q(payee=user)
        )

class EarningsView(generics.ListAPIView):
    serializer_class = EarningSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Earning.objects.filter(freelancer=self.request.user)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def earnings_summary(request):
    if request.user.user_type != 'freelancer':
        return Response({'error': 'Only freelancers can view earnings'}, status=403)
    
    earnings = Earning.objects.filter(freelancer=request.user)
    
    total_earned = earnings.aggregate(total=Sum('amount'))['total'] or 0
    available_balance = earnings.filter(withdrawn=False).aggregate(
        total=Sum('amount')
    )['total'] or 0
    withdrawn = earnings.filter(withdrawn=True).aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    return Response({
        'total_earned': total_earned,
        'available_balance': available_balance,
        'withdrawn': withdrawn,
        'pending_payments': earnings.filter(payment__status='pending').count()
    })
