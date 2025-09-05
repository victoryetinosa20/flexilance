from rest_framework import generics, permissions
from .models import Contract
from .serializers import ContractSerializer

class MyContractsView(generics.ListAPIView):
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'freelancer':
            return Contract.objects.filter(freelancer=user)
        elif user.user_type == 'client':
            return Contract.objects.filter(client=user)
        return Contract.objects.none()

class ContractDetailView(generics.RetrieveAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Contract.objects.filter(
            models.Q(freelancer=user) | models.Q(client=user)
        )