from rest_framework import viewsets, permissions
from django.db.models import Q

from .models import Report
from .serializers import ReportSerializer
from .permissions import *


class ReportViewSet(viewsets.ModelViewSet):

    serializer_class = ReportSerializer

    def get_queryset(self):

        user = self.request.user

        # admin bisa lihat semua
        if user.is_admin:
            return Report.objects.all()

        # citizen
        return Report.objects.filter(
            Q(status__in=[
                'REPORTED',
                'VERIFIED',
                'IN_PROGRESS',
                'RESOLVED'
            ]) |
            Q(
                reporter=user,
                status='DRAFT'
            )
        )

    def get_permissions(self):

        if self.action in ['update', 'partial_update', 'destroy']:
            return [
                permissions.IsAuthenticated(),
                IsOwnerAndDraftOrReadOnly()
            ]

        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):

        if self.request.user.is_admin:
            raise permissions.PermissionDenied(
                "Admin tidak boleh membuat laporan."
            )

        serializer.save(reporter=self.request.user)