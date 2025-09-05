from rest_framework import serializers
from .models import Payment, Earning
from accounts.serializers import UserSerializer


class PaymentSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)
    payee = UserSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = (
            'payer',
            'payee',
            'platform_fee',
            'net_amount',
            'transaction_id',
            'created_at',
            'completed_at'
        )


class EarningSerializer(serializers.ModelSerializer):
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Earning
        fields = '__all__'
        read_only_fields = (
            'payment',       # Make payment read-only
            'created_at',    #  Assuming you have created_at in Earning model
            'updated_at',    #  Assuming you have updated_at in Earning model
        )
